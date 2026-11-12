from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from services.analogy_generator import generate_concept_response

# Create the FastAPI application
app=FastAPI(
    title="ConceptVerse",
    description=(
        "AI-powered concept explanation, "
        "analogy, and mnemonic generation API."
    ),
    version="1.0.0"
)

# Enable communication with the Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Request Model
class ConceptRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=3,
        max_length=5000,
        description=(
            "The concept, definition, "
            "or selected paragraph."
        )
    )

    analogy_style: str = Field(
        default="daily life",
        description=(
            "The preferred style of analogy."
        )
    )

    difficulty: str = Field(
        default="beginner",
        description=(
            "The explanation difficulty level."
        )
    )
    

# Response Model
class ConceptResponse(BaseModel):
    concept: str
    simple_explanation: str
    analogy: str
    mnemonic: str
    example: str
    exam_answer: str
    
# Home Endpoint
@app.get("/")
def home():
    return {
        "project": "ConceptVerse",
        "message": (
            "ConceptVerse backend is running successfully."
        ),
        "status": "online"
    }
    
# Health Check Endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ConceptVerse API"
    }
    
# Main AI Generation Endpoint
@app.post( "/api/generate", response_model=ConceptResponse)
def generate_concept(request:ConceptRequest):
    try:
        result=generate_concept_response(
        text=request.text,
        analogy_style=request.analogy_style,
        difficulty=request.difficulty
    )
        return result
    
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
        
    except Exception as error:
        print(
            "ConceptVerse backend error:",
            error
        )

        raise HTTPException(
               status_code=500,
               detail=(
                "ConceptVerse could not generate "
                "the learning content. "
                "Please try again."
            )
        )
        


    

    
    




