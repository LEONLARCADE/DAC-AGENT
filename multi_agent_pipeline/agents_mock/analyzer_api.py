from fastapi import FastAPI
import uvicorn
import time

app = FastAPI(title="Analyzer Agent Mock API")

@app.post("/process")
def process(data: dict):
    print(f"Analyzer received: {data}")
    time.sleep(1)
    
    # --- YOUR CUSTOM LLM / LOGIC GOES HERE ---
    
    output = data.copy()
    output["analysis"] = f"Analyzed {len(data.get('abstracts', []))} abstracts."
    output["analyzer_status"] = "Success"
    
    return output

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8002)
