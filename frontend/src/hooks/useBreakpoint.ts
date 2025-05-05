import { useState, useEffect } from "react";

export type BreakpointType = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

const breakpoints = {
  xs: "480px",
  sm: "576px",
  md: "768px",
  lg: "992px",
  xl: "1200px",
  xxl: "1600px",
};

export default function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<BreakpointType>("lg");
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < parseInt(breakpoints.sm)) {
        setBreakpoint("xs");
        setIsMobile(true);
      } else if (width < parseInt(breakpoints.md)) {
        setBreakpoint("sm");
        setIsMobile(true);
      } else if (width < parseInt(breakpoints.lg)) {
        setBreakpoint("md");
        setIsMobile(true);
      } else if (width < parseInt(breakpoints.xl)) {
        setBreakpoint("lg");
        setIsMobile(false);
      } else if (width < parseInt(breakpoints.xxl)) {
        setBreakpoint("xl");
        setIsMobile(false);
      } else {
        setBreakpoint("xxl");
        setIsMobile(false);
      }
    };

    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);

    return () => {
      window.removeEventListener("resize", checkBreakpoint);
    };
  }, []);

  return { breakpoint, isMobile };
}
