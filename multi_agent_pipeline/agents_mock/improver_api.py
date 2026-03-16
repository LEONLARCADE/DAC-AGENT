from fastapi import FastAPI
import uvicorn
import time

app = FastAPI(title="Improver Agent Mock API")

@app.post("/process")
def process(data: dict):
    print(f"Improver received: {data}")
    time.sleep(1)
    
    # --- YOUR CUSTOM LLM / LOGIC GOES HERE ---
    
    output = data.copy()
    iteration = data.get("loop_iteration", 1)
    output["improved_idea"] = f"Improved Idea v{iteration+1} addressing critique: {data.get('critique')}"
    output["improver_status"] = f"Improved iteration {iteration}"
    
    return output

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8005)
