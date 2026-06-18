"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

export function AlertSubscribe() {
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
      <div className="flex items-center gap-2 text-muted-foreground">
        <Bell className="w-4 h-4" />
        <p className="text-sm">
          Get emailed and Discord-notified when a regime anomaly fires.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && subscribe()}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 text-sm bg-background border border-border
            rounded-lg focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={subscribe}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium
            rounded-lg hover:bg-primary/90 transition-colors"
        >
          Subscribe
        </button>
        <button
          onClick={unsubscribe}
          className="px-4 py-2 bg-muted/40 text-muted-foreground text-sm font-medium
            rounded-lg hover:bg-muted transition-colors"
        >
          Unsub
        </button>
      </div>
      {status !== "idle" && (
        <p
          className={`text-xs ${status === "success" ? "text-green-400" : "text-red-400"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
