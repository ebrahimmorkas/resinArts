import React, { useContext, useState } from "react";
import { Instagram, Facebook, MessageCircle, Phone, Mail, Globe, MapPin } from "lucide-react";
import { CompanySettingsContext } from "../../../../Context/CompanySettingsContext";
import PolicyModal from "../Home/PolicyModal";

export default function Footer() {
  const { companySettings } = useContext(CompanySettingsContext);
  const [policyModal, setPolicyModal] = useState({ isOpen: false, type: '' });

  const openPolicyModal = (type) => {
    setPolicyModal({ isOpen: true, type });
  };

  const closePolicyModal = () => {
    setPolicyModal({ isOpen: false, type: '' });
  };

  // Developer dummy data
  const developerInfo = {
    name: "Ebrahim Mustafa Morkas",
    email: "ebrahim.morkas@example.com",
    phone: "+91 98765 43210",
    whatsapp: "+919876543210",
    portfolio: "https://ebrahimmorkas.dev"
  };

  return (
    <>
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mb-8">
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

            {/* Contact Us */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                {companySettings?.adminPhoneNumber && (
                  <li>
                    <a
                      href={`tel:${companySettings.adminPhoneNumber}`}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="break-all">{companySettings.adminPhoneNumber}</span>
                    </a>
                  </li>
                )}
                {companySettings?.adminWhatsappNumber && (
                  <li>
                    <a
                      href={`https://wa.me/${companySettings.adminWhatsappNumber.replace(
                        /[^0-9]/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="break-all">{companySettings.adminWhatsappNumber}</span>
                    </a>
                  </li>
                )}
                {companySettings?.adminEmail && (
                  <li>
                    <a
                      href={`mailto:${companySettings.adminEmail}`}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="break-all">{companySettings.adminEmail}</span>
                    </a>
                  </li>
                )}
                {companySettings?.adminAddress && (
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-1" />
                    <span className="break-words">
                      {companySettings.adminAddress}
                      {companySettings.adminCity && `, ${companySettings.adminCity}`}
                      {companySettings.adminState && `, ${companySettings.adminState}`}
                      {companySettings.adminPincode && ` - ${companySettings.adminPincode}`}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Developer Section */}
          <div className="border-t border-gray-700 pt-6 pb-6">
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Developed By</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Developer Name */}
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-gray-400 text-sm font-medium">Name:</span>
                  <span className="text-white text-sm">{developerInfo.name}</span>
                </div>

                {/* Developer Email */}
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a
                    href={`mailto:${developerInfo.email}`}
                    className="text-gray-300 text-sm hover:text-white transition-colors break-all"
                  >
                    {developerInfo.email}
                  </a>
                </div>

                {/* Developer Phone */}
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a
                    href={`tel:${developerInfo.phone}`}
                    className="text-gray-300 text-sm hover:text-white transition-colors"
                  >
                    {developerInfo.phone}
                  </a>
                </div>

                {/* Developer Portfolio/WhatsApp */}
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <a
                    href={`https://wa.me/${developerInfo.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-green-500 transition-colors"
                    title="Contact on WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <a
                    href={developerInfo.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-blue-400 transition-colors"
                    title="Visit Portfolio"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-300 text-sm">
              © 2024 {companySettings?.companyName || "Our Company"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={policyModal.isOpen}
        type={policyModal.type}
        onClose={closePolicyModal}
      />
    </>
  );
}