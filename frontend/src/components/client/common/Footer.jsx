import React, { useContext } from "react";
// import { CompanySettingsContext } from "../../../Context/CompanySettingsContext";
import { Instagram, Facebook, MessageCircle, X } from "lucide-react";
import { CompanySettingsContext } from "../../../../Context/CompanySettingsContext";


export default function Footer({ openPolicyModal }) {
  const { companySettings } = useContext(CompanySettingsContext);

  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* About Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                openPolicyModal("about");
              }}
              className="text-gray-300 text-sm hover:text-white transition-colors"
            >
              Learn more about us
            </a>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openPolicyModal("return");
                  }}
                  className="hover:text-white transition-colors"
                >
                  Return Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openPolicyModal("refund");
                  }}
                  className="hover:text-white transition-colors"
                >
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openPolicyModal("privacy");
                  }}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openPolicyModal("terms");
                  }}
                  className="hover:text-white transition-colors"
                >
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openPolicyModal("shipping");
                  }}
                  className="hover:text-white transition-colors"
                >
                  Shipping Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {companySettings?.instagramId && (
                <a
                  href={`https://instagram.com/${companySettings.instagramId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-pink-500 transition-colors"
                  title="Follow us on Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {companySettings?.facebookId && (
                <a
                  href={`https://facebook.com/${companySettings.facebookId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                  title="Follow us on Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {companySettings?.adminWhatsappNumber && (
                <a
                  href={`https://wa.me/${companySettings.adminWhatsappNumber.replace(
                    /[^0-9]/g,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-green-500 transition-colors"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center space-y-2">
          <p className="text-gray-300 text-sm">
            © 2024 {companySettings?.companyName || "Our Company"}. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs">
            Designed and Developed by Ebrahim Mustafa Morkas
          </p>
        </div>
      </div>
    </footer>
  );
}