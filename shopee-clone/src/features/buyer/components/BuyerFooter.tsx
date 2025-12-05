import React from 'react';
import spayImg from '../../../assets/PAYMENTS/buyer-spay.png';
import spaylaterImg from '../../../assets/PAYMENTS/buyer-spaylater.png';
import maribankImg from '../../../assets/PAYMENTS/buyer-maribank.png';
import dragonpayImg from '../../../assets/PAYMENTS/buyer-dragonpay.png';
import mastercardImg from '../../../assets/PAYMENTS/buyer-mastercard.png';
import visaImg from '../../../assets/PAYMENTS/buyer-visa.png';
import jcbImg from '../../../assets/PAYMENTS/buyer-jcb.png';
import bpiImg from '../../../assets/PAYMENTS/buyer-bpi.png';
import mayaImg from '../../../assets/PAYMENTS/buyer-maya.png';
import spxImg from '../../../assets/LOGISTICS/buyer-spx.png';
import flashExpressImg from '../../../assets/LOGISTICS/buyer-flash-express.png';
import jntExpressImg from '../../../assets/LOGISTICS/buyer-jnt-express.png';
import twogoExpressImg from '../../../assets/LOGISTICS/buyer-2go-express.png';
import xdeImg from '../../../assets/LOGISTICS/buyer-xde.png';
import ytoExpressImg from '../../../assets/LOGISTICS/buyer-yto-express.png';
import worklinkDeliveryImg from '../../../assets/LOGISTICS/buyer-worklink-delivery.png';
import qrCodeImg from '../../../assets/APP-DOWNLOAD/buyer-qr-code.png';
import appStoreImg from '../../../assets/APP-DOWNLOAD/buyer-app-store.png';
import googlePlayImg from '../../../assets/APP-DOWNLOAD/buyer-google-play.png';
import appGalleryImg from '../../../assets/APP-DOWNLOAD/buyer-app-gallery.png';

const BuyerFooter: React.FC = () => {
  return (
    <>
      {/* Main Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-5 py-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-xs">
            {/* Customer Service */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 uppercase">Customer Service</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-shopee-orange">Help Centre</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Shopee Cares PH</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Payment Methods</a></li>
                <li><a href="#" className="hover:text-shopee-orange">ShopeePay</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Shopee Coins</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Order Tracking</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Free Shipping</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Return & Refund</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Shopee Guarantee</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Overseas Product</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Contact Us</a></li>
              </ul>
            </div>

            {/* About Shopee */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 uppercase">About Shopee</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-shopee-orange">About Us</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Shopee Blog</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Shopee Careers</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Policies</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Shopee Privacy Policy</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Shopee Mall</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Seller Centre</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Flash Deals</a></li>
                <li><a href="#" className="hover:text-shopee-orange">Media Contact</a></li>
              </ul>
            </div>

            {/* Payment */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 uppercase">Payment</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={spayImg} alt="SPay" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={spaylaterImg} alt="SPayLater" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={maribankImg} alt="MariBank" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={dragonpayImg} alt="Dragonpay" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={mastercardImg} alt="Mastercard" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={visaImg} alt="VISA" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={jcbImg} alt="JCB" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={bpiImg} alt="BPI" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={mayaImg} alt="Maya" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
              
              <h4 className="font-bold text-gray-800 mb-4 mt-6 uppercase">Logistics</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={spxImg} alt="SPX" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={flashExpressImg} alt="Flash Express" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={jntExpressImg} alt="J&T Express" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={twogoExpressImg} alt="2GO Express" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={xdeImg} alt="XDE" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={ytoExpressImg} alt="YTO Express" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="bg-white border border-gray-200 rounded p-1 h-8 flex items-center justify-center">
                  <img src={worklinkDeliveryImg} alt="WorkLink Delivery" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            </div>

            {/* Follow Us */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 uppercase">Follow Us</h4>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="#" className="hover:text-shopee-orange flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-[10px]">f</span>
                    </div>
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-shopee-orange flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-[10px]">📷</span>
                    </div>
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-shopee-orange flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-[10px]">𝕏</span>
                    </div>
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-shopee-orange flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-[10px]">in</span>
                    </div>
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>

            {/* Shopee App Download */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4 uppercase">Shopee App Download</h4>
              <div className="flex gap-2 mb-4">
                <img src={qrCodeImg} alt="QR Code" className="w-16 h-16 border border-gray-200" />
                <div className="flex flex-col gap-1">
                  <img src={appStoreImg} alt="App Store" className="h-5 object-contain" />
                  <img src={googlePlayImg} alt="Google Play" className="h-5 object-contain" />
                  <img src={appGalleryImg} alt="AppGallery" className="h-5 object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-5 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
              <div>
                © 2025 Shopee. All Rights Reserved.
              </div>
              <div className="flex items-center gap-2">
                <span>Country & Region:</span>
                <a href="#" className="hover:text-shopee-orange">Argentina</a> |
                <a href="#" className="hover:text-shopee-orange">Singapore</a> |
                <a href="#" className="hover:text-shopee-orange">Indonesia</a> |
                <a href="#" className="hover:text-shopee-orange">Thailand</a> |
                <a href="#" className="hover:text-shopee-orange">Malaysia</a> |
                <a href="#" className="hover:text-shopee-orange">Vietnam</a> |
                <a href="#" className="hover:text-shopee-orange font-semibold">Philippines</a> |
                <a href="#" className="hover:text-shopee-orange">Brazil</a> |
                <a href="#" className="hover:text-shopee-orange">México</a> |
                <a href="#" className="hover:text-shopee-orange">Taiwan</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default BuyerFooter;
