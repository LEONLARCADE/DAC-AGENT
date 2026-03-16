from fastapi import FastAPI
import uvicorn
import time

app = FastAPI(title="Critic Agent Mock API")

@app.post("/process")
def process(data: dict):
    print(f"Critic received: {data}")
    time.sleep(1)
    
    # --- YOUR CUSTOM LLM / LOGIC GOES HERE ---
    
    output = data.copy()
    iteration = data.get("loop_iteration", 1)
    output["critique"] = f"Critique of idea v{iteration}: Needs more evidence."
    output["critic_status"] = f"Critiqued iteration {iteration}"
    
    return output

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8004)
