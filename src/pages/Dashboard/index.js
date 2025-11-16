import { useSession, signOut } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();
  if (!session) return <p>Loading...</p>;

  // Sample images – put these in /public/images/
  const images = [
    "/images/pic1.jpg",
    "/images/pic2.jpg",
    "/images/pic.jpg",
    "/images/pic4.jpg",
    "/images/pic5.jpg",
    "/images/pic6.jpg",
    "/images/pic7.jpg",
    "/images/pic8.jpg",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#f0f2f5",
        color: "#000",
        paddingTop: "80px", 
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
  
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "#fff",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 20px",
          zIndex: 1000,
        }}
      >
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            padding: "10px 15px",
            border: "none",
            borderRadius: "5px",
            backgroundColor: "#1877f2",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

  
      <div style={{ textAlign: "center", padding: "0 20px" }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "30px" }}>
          Welcome {session.user.name}!
        </div>

     
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "20px",
            maxHeight: "calc(100vh - 150px)",
            overflowY: "auto",
            paddingBottom: "20px",
          }}
        >
          {images.map((src, index) => (
            <div
              key={index}
              style={{
                flex: "0 1 calc(25% - 20px)", 
                boxSizing: "border-box",
              }}
            >
              <img
                src={src}
                alt={`pic-${index}`}
                style={{
                  width: "100%",
                  height: "auto", 
                  borderRadius: "10px",
                  border: "2px solid #ccc",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
