"use client";

export default function UserAvatar({
    user,
}) {

    const name =
        user?.fullName ||
        user?.username ||
        "User";


    const initials =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                (part) =>
                    part
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");


    return (
        <div
            className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-purple-500/15
                bg-purple-500/[0.06]
                text-xs
                font-black
                text-purple-300
            "
        >
            {initials || "U"}
        </div>
    );

}