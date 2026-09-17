import * as React from "react"
import darkModeImage from "../assets/darkMODE.jpg"

const logoSrc = darkModeImage

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number
}

export function Logo({ size = 240, className, alt = "Logo", ...props }: LogoProps) {
  return (
    <img
      src={logoSrc}
      width={size}
      height={size}
      alt={alt}
      className={className}
      {...props}
    />
  )
}
