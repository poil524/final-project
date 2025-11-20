import { useEffect } from "react";
//import { useNavigate } from "react-router-dom";

function useNavigationBlocker(shouldWarn) {
    //const navigate = useNavigate();

    // Browser refresh / tab close
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!shouldWarn) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [shouldWarn]);

    // Back/forward buttons
    useEffect(() => {
        const handlePopState = (e) => {
            if (!shouldWarn) return;
            const confirmLeave = window.confirm(
                "You have unsaved changes. Are you sure you want to leave this page?"
            );
            if (!confirmLeave) {
                // Stay on the same page by pushing back the current location
                window.history.pushState(null, document.title, window.location.pathname);
            }
        };

        window.history.pushState(null, document.title, window.location.pathname);
        window.addEventListener("popstate", handlePopState);

        return () => window.removeEventListener("popstate", handlePopState);
    }, [shouldWarn]);
}

export default useNavigationBlocker;
