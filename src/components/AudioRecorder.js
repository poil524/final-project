import React, { useState, useRef } from "react";
import axios from "axios";

const AudioRecorder = ({ testId, sectionIndex, onUploadComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                audioChunks.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(audioChunks.current, { type: "audio/mp3" });
                const localPreview = URL.createObjectURL(blob);
                setAudioURL(localPreview); // Show local preview while uploading
                /*
                                const file = new File([blob], `speaking_${Date.now()}.mp3`, { type: "audio/mp3" });
                                const formData = new FormData();
                                formData.append("audio", file);
                                formData.append("testId", testId);
                
                                try {
                                    const res = await axios.post("http://localhost:5000/api/tests/upload-audio", formData, {
                                        headers: { "Content-Type": "multipart/form-data" },
                                    });
                
                                    const key = res.data.key;
                
                                    // Upload success → clear local preview before notifying parent
                                    setAudioURL(null);
                
                                    if (onUploadComplete) {
                                        onUploadComplete(key);
                                    }
                                } catch (err) {
                                    console.error("Audio upload failed:", err);
                                    alert("Upload failed");
                                }
                                    */
                const file = new File([blob], `speaking_${Date.now()}.mp3`, { type: "audio/mp3" });
                const formData = new FormData();
                formData.append("audio", file);
                formData.append("testId", testId);
                formData.append("folderType", "student-speaking");

                // append studentId from token-protected endpoint
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        alert("You must be logged in to record.");
                        return;
                    }

                    // decode token to get student ID (or request backend to decode)
                    // Option A: decode directly
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    const studentId = payload?.id || payload?._id; // depends on your JWT payload
                    formData.append("studentId", studentId);

                    const res = await axios.post("http://localhost:5000/api/tests/upload-audio", formData, {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    const key = res.data.key;

                    // Upload success → clear local preview
                    setAudioURL(null);
                    if (onUploadComplete) {
                        // Encode before sending to backend
                        //const safeKey = encodeURIComponent(key);
                        onUploadComplete(key);
                    }

                } catch (err) {
                    console.error("Audio upload failed:", err);
                    alert("Upload failed");
                }

            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Could not start recording:", err);
            alert("Microphone permission is required.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div style={{ marginTop: "10px" }}>
            <button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? "Stop Recording" : "Start Recording"}
            </button>

            {/* Show only while uploading / before S3 replaces it */}
            {audioURL && (
                <div style={{ marginTop: "10px" }}>
                    <audio src={audioURL} controls />
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
