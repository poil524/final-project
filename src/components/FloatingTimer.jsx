import React, { useEffect, useState, useRef } from "react";
import "./FloatingTimer.css"; // optional, for styling

const FloatingTimer = ({ durationMinutes = 60, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60); // in seconds
    const hasTimeUpFired = useRef(false); // track if onTimeUp already called

    useEffect(() => {
        if (timeLeft <= 0) {
            if (onTimeUp && !hasTimeUpFired.current) {
                hasTimeUpFired.current = true;
                onTimeUp(); // call only once
            }
            return; // stop timer
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeUp]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    return (
        <div className="floating-timer">
            ⏱ {formatTime(timeLeft)}
        </div>
    );
};

export default FloatingTimer;
