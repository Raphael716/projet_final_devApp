import "./Footer.css";

export default function Footer() {
  return (
    <footer id="contact" className="footer">
      <p>
        &copy; {new Date().getFullYear()} Software Production Line
      </p>
    </footer>
  );
}
