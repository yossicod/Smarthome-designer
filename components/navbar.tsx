import Button from "./UI/Button.tsx";
import { useAuth } from "../src/context/useAuth";

const Navbar = () => {
  const { authState, signIn, signOut } = useAuth();
  const { isSignedIn, userName } = authState;

  return (
    <header className={"navbar"}>
      <nav className={"inner"}>
        <div className={"left"}>
          <div className={"brand"}>
            <img src="/logo.png" alt="Logo" className={"logo"} style={{ width: 'auto', height: '64px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.1) saturate(1.1)' }} />
            <span className={"name"}>SmartHome Designer</span>
          </div>
          <ul className={"links"}>
            <a href="#">Product</a>
            <a href="#">Pricing</a>
            <a href="#">Community</a>
            <a href="#">Enterprise</a>
            <a href="#">Bot</a>
          </ul>
        </div>
        <div className={"actions"}>
          {isSignedIn ? (
            <>
              <span className={"greeting"}>
                {userName ? `Hi, ${userName}` : "Signed in"}
              </span>
              <Button size="sm" onClick={signOut} className={"btn"}>
                log out
              </Button>
            </>
          ) : (
            <>
              <Button onClick={signIn} size={"sm"} variant="ghost">
                Log In
              </Button>
              <a
                href="#login"
                className={"cta"}
                onClick={(event) => {
                  event.preventDefault();
                  void signIn();
                }}
              >
                get starred
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
