import '../Styles/Contact.css';
import { FaArrowLeft } from "react-icons/fa";
import { Link } from 'react-router-dom';

function Contact() {
    return (

    <>

    {/* NAV --*/}
    <nav className="navbar">
      <div className="nav-left">
        
          
          <Link  className='icon-btn' to='/'><FaArrowLeft /></Link>
        
        <span className="logo">KechBus</span>
      </div>
    </nav>

    {/*  HERO--*/}
    <section className="hero">
      <div className="hero-content">
        <h1>Contact Us</h1>
        <p>We're here to help your journeys in Marrakech.</p>
      </div>
    </section>

   { /*  CARDS--*/}
    <section className="cards">
      <div className="card">
        <h3>WhatsApp Support</h3>
        <p>Instant response for emergencies</p>
      </div>

      <div className="card">
        <h3>Email Us</h3>
        <p>support@kechbus.ma</p>
      </div>

      <div className="card">
        <h3>Call Center</h3>
        <p>0801 00 24 24</p>
      </div>
    </section>

    {/*  FORM--*/}
    <section className="contact">
      <form className="form">
        <input type="text" placeholder="Full Name" />
        <input type="email" placeholder="Email" />
        <input type="text" placeholder="Subject" />
        <textarea placeholder="Message"></textarea>
        <button type="submit">Send Message</button>
      </form>
    </section>

    <footer className="footer">
      <p>© 2026 KechBus Marrakech</p>
    </footer>

    </>

    )
    }


export default Contact 