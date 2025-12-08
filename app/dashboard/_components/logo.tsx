import Image from "next/image";

export const Logo = () => {
    return (
        <Image
            height={120}
            width={120}
            alt="logo"
            src="/logo.png"
            unoptimized
        />
    )
}