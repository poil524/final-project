import { useEffect, useState } from "react";
import axios from "axios";

const AudioPlayer = ({ s3Key }) => {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        const fetchUrl = async () => {
            try {
                let key = s3Key;
                if (!key) return;

                // Remove any leading "audio/" if present
                key = key.replace(/^audio\//, "");

                // If it's a full URL, extract just the filename
                if (key.startsWith("http")) {
                    key = key.split("/").pop();
                }

                console.log("Resolved key to request:", key);

                const res = await axios.get(`http://localhost:5000/api/tests/audio-url/${key}`);

                if (res.data?.url) {
                    setUrl(res.data.url);
                    console.warn("No signed URL returned from backend");
                }
            } catch (err) {
                console.error("Failed to load audio:", err.response?.data || err.message);
            }
        };

        if (s3Key) fetchUrl();
        else console.warn("No s3Key provided to AudioPlayer");
    }, [s3Key]);

    if (!url) return <p>Loading audio...</p>;

    return (
        <audio
            controls
            src={url}
            style={{ marginBottom: 12, width: "100%" }}
        />
    );
};

export default AudioPlayer;
