'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white mt-16">
      {/* Promotional Banners */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Balloon Blast Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded h-28 flex items-center justify-between relative overflow-hidden">
            <div className="z-10">
              <p className="text-xs font-bold mb-1">BALLOON BLAST</p>
              <h3 className="text-xl font-bold">CASH-IN TO WIN</h3>
              <p className="text-lg font-bold text-yellow-300">UP TO ₱2,000</p>
            </div>
            <div className="text-5xl opacity-40">🎈</div>
          </div>

          {/* Lazada Loans Banner */}
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6 rounded h-28 flex items-center justify-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💗</span>
                <p className="text-xs font-bold">Lazada Loans</p>
              </div>
              <h3 className="text-xl font-bold">MONTHLY</h3>
              <p className="text-xs">INSTALLMENT PLANS</p>
              <p className="text-xs">with our accredited partners</p>
            </div>
          </div>

          {/* Save More Wallet Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded h-28 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">SAVE MORE</h3>
              <p className="text-xs">with 💗 Lazada Wallet</p>
            </div>
            <div className="text-4xl">😊</div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Payments Row (above all text) */}
          <div className="grid grid-cols-3 gap-12 mb-12">
            {/* Payment Methods */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Payment Methods</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="w-16 h-12 bg-white border border-gray-300 rounded flex items-center justify-center text-center p-1">
                  <span className="text-xl">💗</span>
                </div>
                <div className="w-16 h-12 bg-white border border-gray-300 rounded flex items-center justify-center font-bold text-blue-600 text-sm">VISA</div>
                <div className="w-16 h-12 bg-white border border-gray-300 rounded flex items-center justify-center">
                  <span className="font-bold text-red-600">●●</span>
                </div>
                <div className="w-16 h-12 bg-white border border-gray-300 rounded flex items-center justify-center text-xs font-bold">JCB</div>
                <div className="w-16 h-12 bg-white border border-gray-300 rounded flex items-center justify-center text-xs font-bold text-blue-600">AMEX</div>
                <div className="w-16 h-12 bg-white border border-gray-300 rounded flex items-center justify-center text-xs font-bold text-blue-600">GCash</div>
                <div className="w-16 h-12 bg-white border border-gray-300 rounded flex items-center justify-center text-xs font-bold text-blue-600">Maya</div>
              </div>
            </div>
            {/* Delivery Services */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Delivery Services</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-300 rounded p-2 flex items-center justify-center h-12">
                  <div className="text-center text-xs font-bold text-gray-900">Lazada<br/>Logistics</div>
                </div>
                <div className="bg-white border border-gray-300 rounded p-2 flex items-center justify-center h-12">
                  <span className="text-lg">🚚</span>
                </div>
                <div className="bg-white border border-gray-300 rounded p-2 flex items-center justify-center h-12">
                  <span className="text-xs font-bold">J&T Express</span>
                </div>
                <div className="bg-yellow-400 border border-yellow-400 rounded p-2 flex items-center justify-center h-12 font-bold text-xs">FLASH</div>
              </div>
            </div>
            {/* Verified By */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Verified by</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-300 rounded p-3 flex items-center justify-center h-12">
                  <span className="text-xs font-bold">🔒 SSL</span>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3 flex items-center justify-center h-12">
                  <span className="text-xs font-bold text-center">PCIDSS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-300 my-8" />

          {/* Top Section - Customer Care & Lazada Info & App */}
          <div className="grid grid-cols-4 gap-8 mb-12">
            {/* Customer Care */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Customer Care</h3>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Help Center</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">How to Buy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Shipping & Delivery</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">International Product Policy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">How to Return</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Question?</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Contact Us</Link></li>
              </ul>
            </div>

            {/* Lazada Info */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Lazada</h3>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><Link href="#" className="hover:text-blue-600 hover:underline">About Lazada</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Affiliate Program</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">LAffiliate Academy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Terms & Conditions</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Press & Media</Link></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline">Intellectual Property Protection</Link></li>
              </ul>
            </div>

            {/* Top Brands and Pages */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Top Brands and Pages</h3>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><span className="font-semibold">MOBILES & TABLETS</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Apple, Cherry Mobile, Asus, Samsung, Starmobile, Blackberry, Elephone, Gionee, Sony, LG</Link></li>
                <li className="pt-2"><span className="font-semibold">COMPUTERS & LAPTOPS</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Toshiba, Dell, Microsoft, Western Digital, Transcend, Logitech, Razer, Kingston, A4tech</Link></li>
                <li className="pt-2"><span className="font-semibold">ELECTRONICS</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">VR Box, Ace, Marshall, Philips, TCL, The Platinum, Sennheiser, Ipega</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Categories</h3>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><span className="font-semibold">WATCHES</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Casio, Invicta, Michael Kors, Fossil</Link></li>
                <li className="pt-2"><span className="font-semibold">FASHION</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Blend, Lacoste, Forever 21, Safety Jogger, Guess, Pererkupe, Mango, Kate Spade, Michael Kors, Vans</Link></li>
                <li className="pt-2"><span className="font-semibold">TRAVEL & LUGGAGE</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">High Sierra, Pilot, American Tourister, Anello, Halo, Tigernu, Rhinox, Thule, Case Logic</Link></li>
              </ul>
            </div>
          </div>

          {/* More Categories Grid */}
          <div className="grid grid-cols-4 gap-8 mb-12">
            {/* Column 1 */}
            <div>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><span className="font-semibold">SPORTS & OUTDOORS</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Coleman, Mikasa, Li-Ning, Shimano, XIX, Lagolog, Spalding, Giant, Thule, Wondercore</Link></li>
                <li className="pt-2"><span className="font-semibold">MOTORS</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Hella, MT, Origine, LS2, GIVI, Pioneer, Osram, Sparco</Link></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><span className="font-semibold">MEDIA, GAMES & MUSIC</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Fernando, Eiphone, D&D, Hard Copy, Yamaha, Davis, Thomson, Behringer, Mozart</Link></li>
                <li className="pt-2"><span className="font-semibold">GROCERIES</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Nestle, Samyang, Kracie, Sakura, Lotte, Nescafe, Jack Daniel's, Neslea, Nutella, Healthy Tropics</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><span className="font-semibold">CAMERAS</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Sony, Panasonic, Fujifilm, Canon, GoPro, Transcend, SJCAM, Yunteng</Link></li>
                <li className="pt-2"><span className="font-semibold">HOME APPLIANCES</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Strandad, American Home, Oster, LG, Carrier, La Germania, Koppel, Hanabishi, Singer, American Heritage</Link></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><span className="font-semibold">HOME & LIVING</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Ikea, Uratex, Wilton, Gofta, Stanley, Mandaus, Firefly, Dewalt, Bosch, Philiflex</Link></li>
                <li className="pt-2"><span className="font-semibold">MOTHER & BABY</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Avent, Fisher Price, MamyPoko, Goodbaby, Huggies, Tiny Buds, IRDY, Enfant, Graco</Link></li>
              </ul>
            </div>
          </div>

          {/* More Categories */}
          <div className="grid grid-cols-4 gap-8 mb-12">
            {/* Column 1 */}
            <div>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><span className="font-semibold">HEALTH & BEAUTY</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Luxée, Gillette, Revlon, Olay, Shiseido, Maybelline, Rimmel London, Benetton, Colourpop</Link></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <ul className="space-y-2 text-xs text-gray-700">
                <li><span className="font-semibold">PETS</span></li>
                <li><Link href="#" className="hover:text-blue-600 hover:underline text-xs">Puppy Love, Pedigree, Friskies, Vitality, Royal Canin, Petsafe, Pemi, Me-O</Link></li>
              </ul>
            </div>

            {/* Column 3 - Empty for balance */}
            <div></div>
            <div></div>
          </div>

          {/* Divider */}
          <hr className="border-gray-300 my-8" />

          {/* Bottom Section - Social & Countries */}
          <div className="flex justify-between items-start">
            {/* Left - Countries */}
            <div>
              <p className="font-bold text-gray-900 mb-3 text-sm">Lazada Southeast Asia</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-2xl">🇵🇭</span>
                <span className="text-2xl">🇲🇾</span>
                <span className="text-2xl">🇹🇭</span>
                <span className="text-2xl">🇻🇳</span>
                <span className="text-2xl">🇮🇩</span>
                <span className="text-2xl">🇸🇬</span>
              </div>
            </div>

            {/* Center - Follow Us */}
            <div>
              <p className="font-bold text-gray-900 mb-3 text-sm">Follow Us</p>
              <div className="flex gap-3">
                <a href="#" title="Facebook" className="text-2xl hover:opacity-70">f</a>
                <a href="#" title="LinkedIn" className="text-2xl hover:opacity-70">in</a>
                <a href="#" title="YouTube" className="text-2xl hover:opacity-70">▶</a>
                <a href="#" title="Instagram" className="text-2xl hover:opacity-70">📷</a>
                <a href="#" title="TikTok" className="text-2xl hover:opacity-70">♪</a>
              </div>
            </div>

            {/* Right - Copyright */}
            <div className="text-right">
              <p className="text-gray-600 text-sm font-semibold">© Lazada 2025</p>
            </div>
          </div>

          {/* Customer Care included above */}
        </div>
      </div>
    </footer>
  );
}
