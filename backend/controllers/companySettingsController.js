const CompanySettings = require('../models/CompanySettings');
const { cloudinary } = require("../utils/cloudinary");

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<boolean>} - Returns true if deletion was successful
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      return false;
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log(`Successfully deleted image with publicId: ${publicId}`);
      return true;
    } else {
      console.log(`Failed to delete image with publicId: ${publicId}`);
      return false;
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// Get company settings
const getCompanySettings = async (req, res) => {
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
// Update company settings
const updateCompanySettings = async (req, res) => {
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
      companyName,
      instagramId,
      facebookId,
      privacyPolicy,
      returnPolicy,
      shippingPolicy,
      refundPolicy,
      termsAndConditions,
      aboutUs,
      receiveOrderEmails,
      lowStockAlertThreshold,
      receiveLowStockEmail,
      receiveOutOfStockEmail,
      shippingPriceSettings,
      autoDeleteOrders
    } = req.body;

    if (!adminName || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Admin name and email are required'
      });
    }

    let settings = await CompanySettings.findOne();
    const parsedShippingSettings = shippingPriceSettings ? JSON.parse(shippingPriceSettings) : {
      isManual: true,
      sameForAll: false,
      commonShippingPrice: 0,
      shippingType: 'city',
      shippingPrices: [],
      freeShipping: false,
      freeShippingAboveAmount: 0
    };

    const parsedAutoDeleteSettings = autoDeleteOrders ? JSON.parse(autoDeleteOrders) : {
      enabled: false,
      deleteStatus: 'Completed',
      deleteAfterUnit: 'months',
      deleteAfterValue: 1
    };

    if (!settings) {
      settings = new CompanySettings({
        adminName,
        adminWhatsappNumber,
        adminPhoneNumber,
        adminAddress,
        adminCity,
        adminState,
        adminPincode,
        adminEmail,
        companyName,
        instagramId,
        facebookId,
        privacyPolicy,
        returnPolicy,
        shippingPolicy,
        refundPolicy,
        termsAndConditions,
        aboutUs,
        receiveOrderEmails,
        lowStockAlertThreshold: lowStockAlertThreshold ? parseInt(lowStockAlertThreshold) : 10,
        receiveLowStockEmail,
        receiveOutOfStockEmail,
        shippingPriceSettings: parsedShippingSettings,
        autoDeleteOrders: parsedAutoDeleteSettings
      });
      await settings.save();
    } else {
      settings.adminName = adminName;
      settings.adminWhatsappNumber = adminWhatsappNumber;
      settings.adminPhoneNumber = adminPhoneNumber;
      settings.adminAddress = adminAddress;
      settings.adminCity = adminCity;
      settings.adminState = adminState;
      settings.adminPincode = adminPincode;
      settings.adminEmail = adminEmail;
      settings.companyName = companyName;
      settings.instagramId = instagramId;
      settings.facebookId = facebookId;
      settings.privacyPolicy = privacyPolicy;
      settings.returnPolicy = returnPolicy;
      settings.shippingPolicy = shippingPolicy;
      settings.refundPolicy = refundPolicy;
      settings.termsAndConditions = termsAndConditions;
      settings.aboutUs = aboutUs;
      settings.receiveOrderEmails = receiveOrderEmails;
      settings.lowStockAlertThreshold = lowStockAlertThreshold;
      settings.receiveLowStockEmail = receiveLowStockEmail;
      settings.receiveOutOfStockEmail = receiveOutOfStockEmail;
      
      if (shippingPriceSettings) {
        const parsedShipping = JSON.parse(shippingPriceSettings);
        settings.shippingPriceSettings = {
          isManual: parsedShipping.isManual !== undefined ? parsedShipping.isManual : true,
          sameForAll: parsedShipping.sameForAll !== undefined ? parsedShipping.sameForAll : false,
          commonShippingPrice: parsedShipping.commonShippingPrice || 0,
          shippingType: parsedShipping.shippingType || 'city',
          shippingPrices: Array.isArray(parsedShipping.shippingPrices) ? parsedShipping.shippingPrices : [],
          cityPrices: Array.isArray(parsedShipping.cityPrices) ? parsedShipping.cityPrices : [],
          statePrices: Array.isArray(parsedShipping.statePrices) ? parsedShipping.statePrices : [],
          zipCodePrices: Array.isArray(parsedShipping.zipCodePrices) ? parsedShipping.zipCodePrices : [],
          freeShipping: parsedShipping.freeShipping !== undefined ? parsedShipping.freeShipping : false,
          freeShippingAboveAmount: parsedShipping.freeShippingAboveAmount || 0
        };
      }

      if (autoDeleteOrders) {
        const parsedAutoDelete = JSON.parse(autoDeleteOrders);
        settings.autoDeleteOrders = {
          enabled: parsedAutoDelete.enabled !== undefined ? parsedAutoDelete.enabled : false,
          deleteStatus: parsedAutoDelete.deleteStatus || 'Completed',
          deleteAfterUnit: parsedAutoDelete.deleteAfterUnit || 'months',
          deleteAfterValue: parsedAutoDelete.deleteAfterValue || 1
        };
      }

      await settings.save();
    }

    if (req.file) {
      // Delete old logo from cloudinary
      if (settings.companyLogo) {
        const oldPublicId = settings.companyLogo.split('/').slice(-2).join('/').split('.')[0];
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (error) {
          console.error('Error deleting old logo:', error);
        }
      }

      // Upload new logo
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'company_settings',
        resource_type: 'image'
      });

      settings.companyLogo = result.secure_url;
    }

    await settings.save();

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
const getPublicPolicies = async (req, res) => {
  try {
    const settings = await CompanySettings.getSingleton();
    
    res.status(200).json({
      success: true,
      data: {
        privacyPolicy: settings.privacyPolicy,
        returnPolicy: settings.returnPolicy,
        shippingPolicy: settings.shippingPolicy,
        refundPolicy: settings.refundPolicy,
        termsAndConditions: settings.termsAndConditions,
        aboutUs: settings.aboutUs
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
const getContactInfo = async (req, res) => {
  try {
    const settings = await CompanySettings.getSingleton();
    
    res.status(200).json({
      success: true,
      data: {
        companyName: settings.companyName,
        companyLogo: settings.companyLogo,
        adminWhatsappNumber: settings.adminWhatsappNumber,
        adminPhoneNumber: settings.adminPhoneNumber,
        adminEmail: settings.adminEmail,
        adminAddress: settings.adminAddress,
        adminCity: settings.adminCity,
        adminState: settings.adminState,
        adminPincode: settings.adminPincode,
        instagramId: settings.instagramId,
        facebookId: settings.facebookId,
        adminName: settings.adminName,
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

module.exports = {
  getCompanySettings,
  updateCompanySettings,
  getPublicPolicies,
  getContactInfo
}