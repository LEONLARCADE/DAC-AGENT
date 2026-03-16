from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import time

app = FastAPI(title="Collector Agent Mock API")

class InputData(BaseModel):
    topic: str
    # Add other expected fields here as needed
    class Config:
        extra = "allow" # allow extra fields

@app.post("/process")
def process(data: dict):
    print(f"Collector received: {data}")
    # Simulating some processing time
    time.sleep(1)
    
    # --- YOUR CUSTOM LLM / LOGIC GOES HERE ---
    
    output = data.copy()
    output["abstracts"] = [
        f"Abstract 1 about {data.get('topic')}",
        f"Abstract 2 about {data.get('topic')}"
    ]
    output["collector_status"] = "Success"
    
    return output

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
