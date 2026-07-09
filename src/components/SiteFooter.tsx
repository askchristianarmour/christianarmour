import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <div className="mt-14">
      <footer className="rounded-[40px] bg-[#1D2B34] px-8 py-10 text-white sm:px-12 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr]">
        <div>
          <Link to="/" className="inline-flex shrink-0">
            <img
              src="/signin/headerlogowithcompname.svg"
              alt="Christian Armour"
              className="h-16 w-auto sm:h-20 lg:h-24"
            />
          </Link>
          <p className="mt-6 w-[311px] max-w-full font-sans text-[18px] font-normal leading-none tracking-normal text-white/70">
            Exegesis, theology, history, and life. Reading the text closely, and the world it came
            from honestly.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <img
                src="/signin/facebookheadlogo.svg"
                alt=""
                className="h-5 w-auto opacity-90 hover:opacity-100"
              />
            </a>
            <a href="https://wa.me" target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <img
                src="/signin/wattsapplogoheader.svg"
                alt=""
                className="h-5 w-5 opacity-90 hover:opacity-100"
              />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <img
                src="/signin/instalogoheader.svg"
                alt=""
                className="h-5 w-5 opacity-90 hover:opacity-100"
              />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-sans text-[18px] font-normal leading-none tracking-normal text-white">
            Articles
          </h3>
          <ul className="mt-4 space-y-2 font-sans text-[18px] font-normal leading-none tracking-normal text-white/70">
            <li>Old testament</li>
            <li>New testament</li>
            <li>Exegesis</li>
            <li>Theology</li>
            <li>History</li>
            <li>Life</li>
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-[18px] font-normal leading-none tracking-normal text-white">
            About
          </h3>
          <ul className="mt-4 space-y-2 font-sans text-[18px] font-normal leading-none tracking-normal text-white/70">
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
          <h3 className="font-sans text-[18px] font-normal leading-none tracking-normal text-white">
            Connect
          </h3>
          <ul className="mt-4 space-y-2 font-sans text-[18px] font-normal leading-none tracking-normal text-white/70">
            <li>
              <Link to="/ask" className="hover:text-white">
                Ask a question
              </Link>
            </li>
          </ul>
        </div>
        </div>
      </footer>

      <p className="mt-6 text-center font-sans text-[18px] font-normal leading-none tracking-normal text-[#1D2B34]/75">
        &copy; 2026 Christian Armour. All rights reserved.
      </p>
    </div>
  )
}
