from fastapi import FastAPI
import uvicorn
import time

app = FastAPI(title="Generator Agent Mock API")

@app.post("/process")
def process(data: dict):
    print(f"Generator received: {data}")
    time.sleep(1)
    
    # --- YOUR CUSTOM LLM / LOGIC GOES HERE ---
    
    output = data.copy()
    iteration = data.get("loop_iteration", 1)
    output["generated_idea"] = f"Draft Idea v{iteration} based on: {data.get('analysis')}"
    output["generator_status"] = f"Generated iteration {iteration}"
    
    return output

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8003)
