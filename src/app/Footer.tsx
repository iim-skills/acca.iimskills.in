"use client";

import {
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaGlobe,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

export default function ContactFooter() {
  return (
    <footer className="bg-neutral-900 text-white">

      {/* Contact Action Bar */}
      <div className="bg-[#108BF2] py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center md:justify-between gap-4">

          {/* Phone */}
          <a
            href="tel:+919580740740"
            className="flex items-center gap-2 font-medium hover:opacity-90"
          >
            <FaPhoneAlt />
            +91 9580 740 740
          </a>

          {/* Email */}
          <a
            href="mailto:info@iimskills.com"
            className="flex items-center gap-2 font-medium hover:opacity-90"
          >
            <FaEnvelope />
            info@iimskills.com
          </a>

          {/* WhatsApp */}
          <a
            href="https://api.whatsapp.com/send?phone=919654128205&text=Hello%20IIMSKILLS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium hover:opacity-90"
          >
            <FaWhatsapp />
            WhatsApp Chat
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Website */}
          <a
            href="https://iimskills.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium hover:opacity-90"
          >
            <FaGlobe />
            www.iimskills.com
            <ExternalLink className="w-4 h-4" />
          </a>

        </div>
      </div>

      {/* Social + Payment */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Social Icons */}
        <div className="flex gap-4 text-xl">
          <a href="https://www.facebook.com/iimskills/" target="_blank" rel="noopener noreferrer">
            <FaFacebook />
          </a>
          <a href="https://twitter.com/iimskills" target="_blank" rel="noopener noreferrer">
            <FaTwitter />
          </a>
          <a href="https://www.linkedin.com/school/iim-skills/mycompany/" target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
          <a href="https://www.instagram.com/iimskillsindia/" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
          <a href="https://www.youtube.com/@iimskills" target="_blank" rel="noopener noreferrer">
            <FaYoutube />
          </a>
        </div>

        {/* Secure Payment Icons */}
        <div className="flex flex-wrap items-center gap-4">
          {[
            "master-card-white-logo.png",
            "visa-card-logo.png",
            "g-pay-logo.png",
            "Paytm-logo.png",
            "razorpay-logo.png",
            "paypal-logo.png",
            "bank-transfer-logo.png",
          ].map((img) => (
            <Image
              key={img}
              src={`/footer-icons/${img}`}
              alt=""
              width={60}
              height={30}
              className="h-6 w-auto"
            />
          ))}
          <Image
            src="/footer-icons/256bit.png"
            alt="Secure Payment"
            width={60}
            height={30}
            className="h-6 w-auto"
          />
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-sm text-neutral-400 pb-6">
        © 2026 IIM SKILLS. All Rights Reserved.
      </div>
    </footer>
  );
}
