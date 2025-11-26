import { useEffect } from "react";

function useNavigationBlocker() {
    // Block refresh / tab close
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = ""; // Required for Chrome
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // Block back/forward navigation
    useEffect(() => {
        // Push one fake state on mount
        window.history.pushState(null, "");

        const handlePopState = () => {
            const confirmLeave = window.confirm("Are you sure you want to leave this page?");
            if (!confirmLeave) {
                // Restore current page without adding extra entries
                window.history.pushState(null, "");
            }
            // If confirmed, the browser will navigate naturally
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);
}

export default useNavigationBlocker;
