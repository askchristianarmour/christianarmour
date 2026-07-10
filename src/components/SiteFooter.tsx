import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <div className="mt-10 sm:mt-14">
      <footer className="rounded-[24px] bg-[#1D2B34] px-5 py-8 text-white sm:rounded-[40px] sm:px-12 sm:py-10 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] lg:gap-10">
          <div>
            <Link to="/" className="inline-flex shrink-0">
              <img
                src="/signin/headerlogowithcompname.svg"
                alt="Christian Armour"
                className="h-12 w-auto sm:h-20 lg:h-24"
              />
            </Link>
            <p className="mt-4 max-w-full font-sans text-[14px] font-normal leading-relaxed tracking-normal text-white/70 sm:mt-6 sm:w-[311px] sm:text-[18px] sm:leading-normal">
              Exegesis, theology, history, and life. Reading the text closely, and the world it came
              from honestly.
            </p>
            <div className="mt-5 flex items-center gap-3.5 sm:mt-6 sm:gap-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <img
                  src="/signin/facebookheadlogo.svg"
                  alt=""
                  className="h-4 w-auto opacity-90 hover:opacity-100 sm:h-5"
                />
              </a>
              <a href="https://wa.me" target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <img
                  src="/signin/wattsapplogoheader.svg"
                  alt=""
                  className="h-4 w-4 opacity-90 hover:opacity-100 sm:h-5 sm:w-5"
                />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <img
                  src="/signin/instalogoheader.svg"
                  alt=""
                  className="h-4 w-4 opacity-90 hover:opacity-100 sm:h-5 sm:w-5"
                />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 sm:gap-8 lg:contents">
            <div>
              <h3 className="inline-flex w-fit flex-col font-sans text-[14px] font-normal leading-none tracking-normal text-white sm:text-[18px]">
                Articles
                <span className="mt-1.5 block h-0.5 w-1/2 self-start bg-[#D4AF37] sm:mt-2" aria-hidden />
              </h3>
              <ul className="mt-3 space-y-2 font-sans text-[13px] font-normal leading-snug tracking-normal text-white/70 sm:mt-4 sm:text-[18px] sm:leading-none">
                <li>Old testament</li>
                <li>New testament</li>
                <li>Exegesis</li>
                <li>Theology</li>
                <li>History</li>
                <li>Life</li>
              </ul>
            </div>

            <div>
              <h3 className="inline-flex w-fit flex-col font-sans text-[14px] font-normal leading-none tracking-normal text-white sm:text-[18px]">
                About
                <span className="mt-1.5 block h-0.5 w-1/2 self-start bg-[#D4AF37] sm:mt-2" aria-hidden />
              </h3>
              <ul className="mt-3 space-y-2 font-sans text-[13px] font-normal leading-snug tracking-normal text-white/70 sm:mt-4 sm:text-[18px] sm:leading-none">
                <li>
                  <Link to="/about" className="hover:text-white">
                    Our story
                  </Link>
                </li>
                <li>
                  <Link to="/about#beliefs" className="hover:text-white">
                    Beliefs
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="inline-flex w-fit flex-col font-sans text-[14px] font-normal leading-none tracking-normal text-white sm:text-[18px]">
                Connect
                <span className="mt-1.5 block h-0.5 w-1/2 self-start bg-[#D4AF37] sm:mt-2" aria-hidden />
              </h3>
              <ul className="mt-3 space-y-2 font-sans text-[13px] font-normal leading-snug tracking-normal text-white/70 sm:mt-4 sm:text-[18px] sm:leading-none">
                <li>
                  <Link to="/ask" className="hover:text-white">
                    Ask a question
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <p className="mt-4 text-center font-sans text-[12px] font-normal leading-normal tracking-normal text-[#1D2B34]/75 sm:mt-6 sm:text-[18px] sm:leading-none">
        &copy; 2026 Christian Armour. All rights reserved.
      </p>
    </div>
  )
}
