import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res.error) {
      alert("Invalid email or password");
    } else {
      router.push("/Dashboard");
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
        onSubmit={handleLogin}
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
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Log In</h2>
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
            backgroundColor: "#1877f2",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Log In
        </button>
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          Don’t have an account?{" "}
          <span
            onClick={() => router.push("/register")}
            style={{ color: "#1877f2", cursor: "pointer", textDecoration: "underline" }}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
}
