import { useEffect } from "react";

function useNavigationBlocker(shouldWarn) {
    // Warn on browser refresh / tab close
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!shouldWarn) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [shouldWarn]);

    // Warn on back/forward buttons
    useEffect(() => {
        if (!shouldWarn) return;

        window.history.pushState({ blocked: true }, "");

        const handlePopState = () => {
            const confirmLeave = window.confirm(
                "You have unsaved changes. Are you sure you want to leave this page?"
            );

            if (!confirmLeave) {
                // User said NO → restore the fake history entry
                window.history.pushState({ blocked: true }, "");
            } else {
                // User said YES → navigate back automatically
                window.history.back();
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);

    }, [shouldWarn]);
}

export default useNavigationBlocker;
