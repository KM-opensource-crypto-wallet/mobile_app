import { useContext } from "react"
import { ThemeContext } from "theme/ThemeContext";

export const useThemeContext = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        console.error("SOmething when wrong while setting up the context")
    }
    return context;

}