import { useState } from "react";
import { useRouter } from "next/router";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message);
      router.push("/login");
    } else {
      alert(data.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundImage: "url('/images/background-reg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <form
        onSubmit={handleRegister}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "350px",
          gap: "10px",
          padding: "30px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "rgba(255,255,255,0.85)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Register</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#42b72a",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Register
        </button>
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            style={{ color: "#1877f2", cursor: "pointer", textDecoration: "underline" }}
          >
            Log In
          </span>
        </p>
      </form>
    </div>
  );
}
