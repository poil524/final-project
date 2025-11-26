import { useEffect, useState } from "react";
import axios from "axios";

const Image = ({ img }) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        const fetchImageUrl = async () => {
            try {
                let key = img?.url;
                if (!key) return;

                // Remove any accidental leading folder
                key = key.replace(/^images\//, "");

                // If it's a full URL (shouldn't be), just extract the filename
                if (key.startsWith("http")) key = key.split("/").pop();

                const res = await axios.get(`http://localhost:5000/api/tests/image-url/${key}`);
                if (res.data?.url) {
                    setImageUrl(res.data.url);
                } else {
                }
            } catch (err) {
                console.error("Failed to fetch image URL:", err.response?.data || err.message);
            }
        };

        if (img?.url) fetchImageUrl();
    }, [img?.url]);

    if (!imageUrl) return;

    return (
        <img
            src={imageUrl}
            alt="Section"
            style={{ maxWidth: "100%", borderRadius: 6, marginBottom: 8 }}
        />
    );
};

export default Image;
