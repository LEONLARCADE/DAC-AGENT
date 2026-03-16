# Start Orchestrator
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn main:app --port 8000 --reload"

# Start Mock Agents
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd agents_mock; python -m uvicorn collector_api:app --port 8001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd agents_mock; python -m uvicorn analyzer_api:app --port 8002"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd agents_mock; python -m uvicorn generator_api:app --port 8003"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd agents_mock; python -m uvicorn critic_api:app --port 8004"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd agents_mock; python -m uvicorn improver_api:app --port 8005"

# Start React Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend_v2; npm run dev"

Write-Host "All agent APIs and the Orchestrator started in separate windows."
Write-Host "Open http://localhost:5173 in your browser to see the new React frontend!"
