import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeCall = async (audioBase64: string, mimeType: string): Promise<any> => {
  const model = "gemini-3.1-pro-preview";

  const systemInstruction = `
[STRICT DETERMINISTIC AUDIT PROTOCOL]
- Identity: You are a binary logic engine. You do not "feel" or "interpret"; you only "verify."
- The Evidence Rule: For every score you give, you must first locate the exact sentence in the transcript. If the evidence does not exist verbatim, the score must be a "Fail."
- Consistency Priority: You must treat this audit as a mathematical proof. The same input must result in the same output every single time.

[CRITICAL P0 SYSTEM MANDATE: 100% VERBATIM TRANSCRIPTION]
Before performing any audit, analysis, or JSON generation, you MUST execute a 100% complete, end-to-end transcription of the provided audio file. This is a Zero-Tolerance Priority (P0).

Phase 1: Audio Processing & Verbatim Transcription
- Audio Isolation: Isolate human speech frequencies. Extract every possible word.
- Zero-Truncation Rule: Transcribe from the first second to the last. No summarizing.
- Complete Dialogue Capture: Include pleasantries, questions, hold times [HOLD], silences [DEAD AIR].
- Speaker Diarization: Label turns as [Agent], [Customer], or [SYSTEM/VOICEMAIL]. Translate regional languages verbatim.

[CALL INITIALIZATION ANALYSIS LAYER]
1. Identification of System Voicemail (IVR):
- Transcript Filtering: If the transcript starts with a standard voicemail prompt (e.g., "The person you are trying to reach is unavailable," "Please leave a message"), label this as [SYSTEM/VOICEMAIL].
- Speaker Correction: NEVER attribute voicemail text to the Agent or Customer. It must be categorized separately.
- Null-Audit Rule (Correct Disposition): If a call consists only of [SYSTEM/VOICEMAIL] or IVR audio and no Customer voice is detected within the first 15 seconds, AND the Agent disconnects within this 15-second window, mark the audit as "N/A - Voicemail/Unanswered Call" and set overall_score to "N/A".

2. Talk-Time Elongation (FATAL ERROR):
- Logic: If the transcript identifies only [SYSTEM/VOICEMAIL] or dead air, and no Customer voice is detected throughout the call.
- Condition: If the Agent elongates the call beyond 15 seconds without any customer interaction (e.g., staying on the line while the voicemail prompt loops or silent dead air).
- Outcome: This MUST be marked as a FATAL ERROR under "fatal_ownership_10".
- Scoring: The overall_score MUST be strictly "0%".
- Reasoning: You must explicitly state: "Fatal: Call elongation on voicemail. Agent remained on an unanswered call for [X] seconds/minutes to manipulate talk time."

3. The "15-Second Voicemail Window" Rule (Exception):
- Late Opening Exemption: If a call starts with a voicemail/IVR prompt and the Customer picks up mid-way or abruptly (e.g., within the first 15 seconds), the Agent must NOT be penalized for a "Late Opening."
- Logic: The "Late Opening" timer should only start from the moment the Customer says "Hello" or provides a verbal cue, not from the start of the recording.

4. Speaker Identification & "Hello" Attribution:
- Voice Fingerprinting: Use context to label speakers.
- If voice says "The Sleep Company," it is the Agent.
- If voice answers a prompt or picks up abruptly, it is the Customer.
- Ensure the initial "Hello" or brand greeting is correctly mapped to the Agent even if there was a 10-15 second buffer of voicemail audio at the start.

Phase 2: The Audit (Dependent Phase)
- STOP. Phase 1 must be 100% complete before Phase 2.
- Audit must be based ONLY on the verbatim transcript generated in Phase 1.
- No hallucinations. If a parameter isn't in the transcript, it's a "Fail".

Role: Top Notch Q Auditor for The Sleep Company.
Context: Comfort-tech brand featuring Japanese Patented SmartGRID technology.

AGENT IDENTIFICATION:
List of known names: Rubiay, Manjusha, Sneha, Vikram, Saif, Anirban, Rakshitha, Gaurav, Ashith, Sameer M, Shraddha S, Sahil Sayyed, Shavez, Dravid Shekar, Saloni Shinde, Sara Kupe, Huned Shaikh, Aditya Bhatkar, Zirgham Raza, Aakash Rajbhar, Hamza Agha, Apurva Bhendekar, Sandeep Khandzode, Mahesh Patil, Shreyash Panchal, Neha Misal, Manorama Lanke, Shahrukh Pathan, Kajal Panwar, Darshan Lotankar, Ramsha Khan, Tarun Chopra, Deepak Mishra, Kiran Ramchandra, Darshan Shirke, Swet Singh, Prateek Katkar, Kaif Khan, Rohit Jadhav, Azman Chaudhary, Karishma Kamble, Kedar Kadam, Santharaj G, Abhishek Gajbhiye, Twinkle Sajan, Noor Mahammad, Jawaz Pasha, Vamsi Krishna, Kamalesh G, Jasmine Agashiya, Abilash Immanuel, Bijith Babuji, Ganesh Munkamuthaka, Kaviya Varshini, Sham Berni, Praveena C, Koushik VS.
[CRITICAL NAME MAPPING]: Map "Talib" to "Ashith".

AUDIT LOGIC & PHILOSOPHY:
- Speaker Differentiation: Agent vs Customer vs SYSTEM/VOICEMAIL.
- Step 1: Opening (Brand mention, Lead bucket relevance).
- Step 2: Pre-Pitch (Mattress/Chair only). Must ask 2+ lifestyle questions.
- Step 3: Sentiment/Adaptability (Empathy First).
- Step 4: Parameter Scoring (Greeting, Needs Assessment, Sales Pitch, Cross-Sell, Closing, Communication, Hold/Mute, Fatals).

[GLOBAL FATAL RULE]
- If any parameter labeled as "fatal" (specifically: pre_pitch_fatal, fatal_behavior_5, or fatal_ownership_10) is marked as "Fail", the "overall_score" MUST be "0%". This is a non-negotiable binary rule that overrides all other scoring calculations.

PRODUCT KNOWLEDGE BASE (MASTER SOURCE OF TRUTH):
- SmartGRID: Hyper-elastic polymer.
- 100-Night Trial: Eligible (Standard mattresses), Excluded (SensAI, Kids, Accessories, 3rd Party).
- Warranty: Standard (10yr), Grand Elite (15yr).
- Mattresses: Ortho (GRID 0.5", Ortho 1", Ortho Pro 5-zone), Luxe (Pro, Royale GOLS), Grand Elite (SilverTex).
- Chairs: Onyx, Aristo, Stylux (SpinePro/iAdapt).
- Massagers: 20-massage battery life.
`;

  const prompt = `Perform a full verbatim transcription and quality audit of the attached audio file. Follow the system instructions strictly.`;

  const audioPart = {
    inlineData: {
      data: audioBase64,
      mimeType: mimeType,
    },
  };

  const gradingParameterSchema = {
    type: Type.OBJECT,
    properties: {
      transcript_evidence: { type: Type.STRING, description: "Verbatim quote from transcript or 'NONE FOUND'" },
      status: { type: Type.STRING, description: "Pass/Fail/NA" },
      reason: { type: Type.STRING, description: "Strict evidence-based explanation" }
    },
    required: ["transcript_evidence", "status", "reason"]
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: [{ parts: [audioPart, { text: prompt }] }],
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.0,
      topK: 1,
      topP: 0.1,
      seed: 42,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          audit_summary: {
            type: Type.OBJECT,
            properties: {
              agent_name: { type: Type.STRING },
              team_type: { type: Type.STRING },
              language: { type: Type.STRING },
              overall_score: { type: Type.STRING },
              call_summary: { type: Type.STRING }
            },
            required: ["agent_name", "team_type", "language", "overall_score", "call_summary"]
          },
          key_identifiers: {
            type: Type.OBJECT,
            properties: {
              product_pitched: { type: Type.STRING },
              primary_pain_point: { type: Type.STRING },
              quality_of_lead: { type: Type.STRING },
              customer_engagement_score: { type: Type.NUMBER },
              timeline_to_purchase: { type: Type.STRING },
              competitors_mentioned: { type: Type.ARRAY, items: { type: Type.STRING } },
              price_sensitivity: { type: Type.STRING },
              pincode_provided: { type: Type.STRING },
              decision_maker: { type: Type.STRING },
              call_ending_type: { type: Type.STRING },
              store_visit_scope: { type: Type.STRING },
              store_visit_insight: { type: Type.STRING },
              closure_prediction: {
                type: Type.OBJECT,
                properties: {
                  probability: { type: Type.STRING },
                  sentiment: { type: Type.STRING },
                  interest_factor: { type: Type.STRING },
                  buying_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
                  closure_blockers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  synopsis: { type: Type.STRING }
                },
                required: ["probability", "sentiment", "interest_factor", "buying_signals", "closure_blockers", "synopsis"]
              }
            },
            required: ["product_pitched", "primary_pain_point", "quality_of_lead", "customer_engagement_score", "timeline_to_purchase", "competitors_mentioned", "price_sensitivity", "pincode_provided", "decision_maker", "call_ending_type", "store_visit_scope", "store_visit_insight", "closure_prediction"]
          },
          grading_sheet: {
            type: Type.OBJECT,
            properties: {
              greeting_5: gradingParameterSchema,
              pre_pitch_fatal: gradingParameterSchema,
              needs_assessment_20: gradingParameterSchema,
              sales_pitch_20: gradingParameterSchema,
              cross_sell: gradingParameterSchema,
              closing_15: gradingParameterSchema,
              communication_10: gradingParameterSchema,
              hold_mute_5: gradingParameterSchema,
              fatal_behavior_5: gradingParameterSchema,
              fatal_ownership_10: gradingParameterSchema
            },
            required: ["greeting_5", "pre_pitch_fatal", "needs_assessment_20", "sales_pitch_20", "cross_sell", "closing_15", "communication_10", "hold_mute_5", "fatal_behavior_5", "fatal_ownership_10"]
          },
          aoi_feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
          transcript: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING },
                original: { type: Type.STRING },
                english: { type: Type.STRING }
              },
              required: ["speaker", "original", "english"]
            }
          }
        },
        required: ["audit_summary", "key_identifiers", "grading_sheet", "aoi_feedback", "transcript"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI model");
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Audit Analysis Failed: The AI model returned an unexpected format. Please try again.");
  }
};

export const generateCoachingFeedback = async (agentStats: any): Promise<any> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
Role: You are the Top Notch Coaching Engine for The Sleep Company. Your mission is to provide specialized, data-driven coaching for Team Leaders (TLs) and Trainers based on an agent's aggregated performance.

AGENT PERFORMANCE DATA:
- Agent Name: ${agentStats.agentName}
- Team: ${agentStats.teamType}
- Total Audits: ${agentStats.totalAudits}
- Avg. Quality Score: ${agentStats.avgScore}%
- Avg. Sentiment Score: ${agentStats.avgSentiment}/10
- Performance Trend: ${agentStats.trend}

RADAR AXES PERFORMANCE (0-100):
${agentStats.radarData.map((d: any) => `- ${d.subject}: ${Math.round(d.A)}%`).join('\n')}

INSTRUCTIONS:
1. Generate TWO distinct feedback sections: Team Leader (TL) and Trainer.
2. TL FEEDBACK:
   - Focus: Sales Push, Urgency, and Conversion.
   - Analysis: Detailed notes on where the agent missed "Closing" or "Sales Push" based on the radar axes.
   - Talk-Track: Provide a specific, high-impact talk-track the TL should use to motivate the agent regarding targets and lead quality.
3. TRAINER FEEDBACK:
   - Focus: "Speil" Mechanics and Product Knowledge.
   - Analysis: Elaborate breakdown of technical errors (e.g., SmartGRID terminology, 100-night trial).
   - Roleplay Focus: Identify which part of the "Speil" needs a roleplay session (e.g., "Needs Assessment" or "Cross-Sell").
4. LANGUAGE: Use clear, constructive, and detailed language that a naive agent can easily understand and implement.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "tl_feedback": {
    "analysis": "...",
    "talk_track": "..."
  },
  "trainer_feedback": {
    "analysis": "...",
    "roleplay_focus": "..."
  }
}
`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI model");
    const jsonString = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse coaching response", e);
    return {
      tl_feedback: { analysis: "Analysis unavailable.", talk_track: "Talk-track unavailable." },
      trainer_feedback: { analysis: "Analysis unavailable.", roleplay_focus: "Roleplay focus unavailable." }
    };
  }
};
