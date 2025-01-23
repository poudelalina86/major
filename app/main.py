from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydub import AudioSegment
import io
import base64

app = FastAPI()

# CORS settings to allow communication with your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],   
    allow_credentials=True,
    allow_methods=[""],
    allow_headers=[""],
)

@app.get("/")
def read_root():
    return {"Hello": "World!"}

@app.post("/process_audio/")
async def process_audio(file: UploadFile = File(...)):
    try:
        # Read uploaded audio file
        audio_data = await file.read()

        # Validate file type
        if not file.filename.endswith('.wav'):
            return {"error": "Only WAV files are supported"}

        # Process audio with pydub
        audio = AudioSegment.from_file(io.BytesIO(audio_data), format="wav")
        processed_audio = audio.set_frame_rate(16000)

        # Export to buffer
        output_buffer = io.BytesIO()
        processed_audio.export(output_buffer, format="wav")
        output_buffer.seek(0)

        # Encode the audio in base64
        base64_audio = base64.b64encode(output_buffer.read()).decode('utf-8')

        # Return the base64 audio string in the response
        return JSONResponse(content={"audio": f"data:audio/wav;base64,{base64_audio}"})

    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)

# from typing import Union
# from fastapi import FastAPI, File, UploadFile
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
# from pydub import AudioSegment
# import io

# app = FastAPI()

# # CORS settings to allow communication with your frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://127.0.0.1:5500"],  # Add your frontend URL here
#     allow_credentials=True,
#     allow_methods=[""],
#     allow_headers=[""],
# )

# @app.get("/")
# def read_root():
#     return {"Hello": "World!"}

# @app.get("/items/{item_id}")
# def read_item(item_id: int, q: Union[str, None]= None):
#     return {"item_id": item_id, "q": q}

# @app.post("/process_audio/")
# async def process_audio(file: UploadFile = File(...)):
#     try:
#         # Read uploaded audio file
#         audio_data = await file.read()

#         # Validate file type
#         if not file.filename.endswith('.wav'):
#             return {"error": "Only WAV files are supported"}

#         # Process audio with pydub
#         audio = AudioSegment.from_file(io.BytesIO(audio_data), format="wav")
#         processed_audio = audio.set_frame_rate(16000)

#         # Export to buffer
#         output_buffer = io.BytesIO()
#         processed_audio.export(output_buffer, format="wav")
#         output_buffer.seek(0)

#         return StreamingResponse(
#             output_buffer, 
#             media_type="audio/wav",
#             headers={
#                 "Content-Disposition": f"attachment; filename=processed_{file.filename}"
#             }
#         )
        
    # except Exception as e:
    #     return {"error": str(e)}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)