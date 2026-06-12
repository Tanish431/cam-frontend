"use client";

import { useState } from "react";

export default function AlertSubscribe() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    async function subscribe() {
        if (!email) return;
        try {
            const res = await fetch("http://localhost:8080/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus("success");
                setMessage(`${data.email} subscribed to regime alerts`);
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.error ?? "subscription failed");
            }
        } catch {
            setStatus("error");
            setMessage("could not connect to server");
        }
    }

    async function unsubscribe() {
        if (!email) return;
        try {
            await fetch("http://localhost:8080/api/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            setStatus("success");
            setMessage(`${email} unsubscribed`);
            setEmail("");
        } catch {
            setStatus("error");
            setMessage("could not connect to server");
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">
                Get emailed and Discord-notified when a regime anomaly fires.
            </p>
            <div className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && subscribe()}
                    placeholder="your@email.com"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                />
                <button
                    onClick={subscribe}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Subscribe
                </button>
                <button
                    onClick={unsubscribe}
                    className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Unsub
                </button>
            </div>
            {status !== "idle" && (
                <p
                    className={`text-xs ${status === "success" ? "text-green-600" : "text-red-500"}`}
                >
                    {message}
                </p>
            )}
        </div>
    );
}
