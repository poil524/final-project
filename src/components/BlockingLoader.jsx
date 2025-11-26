import React from "react";
import "./BlockingLoader.css";

export default function BlockingLoader({ visible, text = "Processing..." }) {
    if (!visible) return null;

    return (
        <div className="blocking-loader-overlay">
            <div className="blocking-loader-box">
                <div className="spinner" />
                <p>{text}</p>
            </div>
        </div>
    );
}
