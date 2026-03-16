from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import asyncio
import json
import re

app = FastAPI(title="Multi-Agent Pipeline Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replace these with the actual URLs of your agents when deployed
AGENT_URLS = {
    "collector": "http://172.16.199.16:8000/fetch-papers", # Friend 1
    "analyzer": "http://172.16.205.130:8000/process",      # Friend 2
    "generator": "http://172.16.205.141:8000/process",     # Friend 3
    "critic": "http://172.16.206.103:8000/process",        # Friend 4
    "improver": "http://127.0.0.1:8005/process",
}

class PipelineRequest(BaseModel):
    topic: str
    loop_count: int
    paper_count: int = 50

async def call_agent(client: httpx.AsyncClient, agent_name: str, payload: dict):
    url = AGENT_URLS.get(agent_name)
    if not url:
        raise ValueError(f"Unknown agent: {agent_name}")
    try:
        if agent_name == "collector" and "fetch-papers" in url:
            # The friend's code uses a GET request to /fetch-papers?topic=...
            # We'll request paper_count papers.
            params = {"topic": payload.get("topic", "AI"), "total": payload.get("paper_count", 50)}
            response = await client.get(url, params=params, timeout=120.0)
        else:
            response = await client.post(url, json=payload, timeout=120.0)
            
        response.raise_for_status()
        
        result = response.json()
        
        # Robustness: If the AI returned a string (like a markdown JSON block), try to parse it
        if isinstance(result, str):
            try:
                # Remove ```json and ``` tags
                clean_str = re.sub(r'```(?:json)?\n?', '', result)
                clean_str = re.sub(r'```', '', clean_str).strip()
                parsed_result = json.loads(clean_str)
                if isinstance(parsed_result, dict):
                    result = parsed_result
            except Exception as parse_e:
                print(f"Failed to parse JSON string from {agent_name}: {parse_e}")
        
        # Robustness: ensure we always return a dictionary for the next agent
        if not isinstance(result, dict):
            return {"content": result}
            
        return result
        
    except httpx.TimeoutException as e:
        print(f"Warning: timeout calling {agent_name}: {e}")
        return {"error": f"{agent_name} timed out. {str(e)}", "previous_data": payload}
    except Exception as e:
        print(f"Error calling {agent_name}: {e}")
        return {"error": f"{agent_name} failed: {str(e)}", "previous_data": payload}

@app.post("/run-pipeline")
async def run_pipeline(request: PipelineRequest):
    topic = request.topic
    loop_count = request.loop_count
    
    pipeline_steps = []
    
    async with httpx.AsyncClient() as client:
        # Step 1: Collector
        payload = {"topic": topic, "paper_count": request.paper_count, "status": "init"}
        pipeline_steps.append({"agent": "System", "action": "Started", "data": payload})
        
        collector_out = await call_agent(client, "collector", payload)
        pipeline_steps.append({"agent": "Collector", "data": collector_out})
        
        # Step 2: Analyzer
        analyzer_out = await call_agent(client, "analyzer", collector_out)
        pipeline_steps.append({"agent": "Analyzer", "data": analyzer_out})
        
        current_data = analyzer_out
        
        # Step 3: Generator
        generator_out = await call_agent(client, "generator", current_data)
        pipeline_steps.append({"agent": "Generator", "data": generator_out})
        
        # Step 4: Critic & Improver (All on Friend 4's laptop)
        # We send it one POST request with the loop_count, and their AI handles the cycles!
        critic_payload = dict(generator_out)
        critic_payload["loop_count"] = loop_count
        
        final_agent_out = await call_agent(client, "critic", critic_payload)
        pipeline_steps.append({"agent": "Critic & Improver Synthesis", "data": final_agent_out})
        
        current_data = final_agent_out
            
    final_output = {
        "final_result": current_data,
        "pipeline_history": pipeline_steps
    }
    return final_output

# Old frontend static mount removed -> React handles UI now

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
