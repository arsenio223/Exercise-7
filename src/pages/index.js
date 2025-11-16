export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
        backgroundImage: "url('/images/background-reg.jpg')", 
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#000",
      }}
    >
      <h1>This site is about Dogs.</h1>
      <p>This is your homepage.</p>

      <a
        href="/login"
        style={{
          margin: "10px",
          padding: "10px 15px",
          backgroundColor: "#1877f2",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "5px",
        }}
      >
        Go to Login
      </a>

      <a
        href="/register"
        style={{
          margin: "10px",
          padding: "10px 15px",
          backgroundColor: "#42b72a",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "5px",
        }}
      >
        Go to Register
      </a>
    </div>
  );
}
