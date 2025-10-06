const CompanySettings = require('../models/CompanySettings');

// Get company settings
exports.getCompanySettings = async (req, res) => {
  try {
    const settings = await CompanySettings.getSingleton();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company settings'
    });
  }
};

// Update company settings
exports.updateCompanySettings = async (req, res) => {
  try {
    const {
      adminName,
      adminWhatsappNumber,
      adminPhoneNumber,
      adminAddress,
      adminCity,
      adminState,
      adminPincode,
      adminEmail,
      instagramId,
      facebookId,
      privacyPolicy,
      returnPolicy,
      shippingPolicy,
      refundPolicy,
      termsAndConditions
    } = req.body;

    // Validation
    if (!adminName || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Admin name and email are required'
      });
    }

    // Get the singleton document
    let settings = await CompanySettings.findOne();
    
    if (!settings) {
      // Create new if doesn't exist
      settings = await CompanySettings.create(req.body);
    } else {
      // Update existing
      settings.adminName = adminName;
      settings.adminWhatsappNumber = adminWhatsappNumber;
      settings.adminPhoneNumber = adminPhoneNumber;
      settings.adminAddress = adminAddress;
      settings.adminCity = adminCity;
      settings.adminState = adminState;
      settings.adminPincode = adminPincode;
      settings.adminEmail = adminEmail;
      settings.instagramId = instagramId;
      settings.facebookId = facebookId;
      settings.privacyPolicy = privacyPolicy;
      settings.returnPolicy = returnPolicy;
      settings.shippingPolicy = shippingPolicy;
      settings.refundPolicy = refundPolicy;
      settings.termsAndConditions = termsAndConditions;
      
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Company settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company settings'
    });
  }
};

// Get public policies (for displaying on website - no authentication required)
exports.getPublicPolicies = async (req, res) => {
  try {
    const settings = await CompanySettings.getSingleton();
    
    res.status(200).json({
      success: true,
      data: {
        privacyPolicy: settings.privacyPolicy,
        returnPolicy: settings.returnPolicy,
        shippingPolicy: settings.shippingPolicy,
        refundPolicy: settings.refundPolicy,
        termsAndConditions: settings.termsAndConditions
      }
    });
  } catch (error) {
    console.error('Error fetching public policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies'
    });
  }
};

// Get contact information (public - for footer, contact page, etc.)
exports.getContactInfo = async (req, res) => {
  try {
    const settings = await CompanySettings.getSingleton();
    
    res.status(200).json({
      success: true,
      data: {
        adminWhatsappNumber: settings.adminWhatsappNumber,
        adminPhoneNumber: settings.adminPhoneNumber,
        adminEmail: settings.adminEmail,
        adminAddress: settings.adminAddress,
        adminCity: settings.adminCity,
        adminState: settings.adminState,
        adminPincode: settings.adminPincode,
        instagramId: settings.instagramId,
        facebookId: settings.facebookId
      }
    });
  } catch (error) {
    console.error('Error fetching contact info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact information'
    });
  }
};