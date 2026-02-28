import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Header() {
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setEmail(data.user?.email ?? null);
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: "1px solid #eee"
            }}
        >
            <h2 style={{ margin: 0 }}>Habit Flow</h2>

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontSize: 14, opacity: 0.7 }}>
                    {email}
                </span>

                <button
                    onClick={handleLogout}
                    style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer"
                    }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}