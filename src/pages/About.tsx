import { useState } from 'react'
import { SiteFooter } from '../components/SiteFooter'

type BeliefSection = {
  id: string
  tab: string
  title: string
  tagline: string
  body: string[]
}

const BELIEF_SECTIONS: BeliefSection[] = [
  {
    id: 'bible',
    tab: 'Bible',
    title: 'The Bible',
    tagline: 'THE INSPIRED WORD OF GOD',
    body: [
      'The Bible consists of 66 books and is inspired, infallible, and inerrant. The Bible is the sole authority for developing doctrines and for directing how Christians should lead their lives. The apocryphal books of the Septuagint were never considered Scripture by the Jews, and are not canonical. While studying the Old Testament, it is beneficial to use the text of the Septuagint along with the Masoretic Text, since the New Testament quotes the Septuagint in over 90% of the instances where there is a difference between the Masoretic Text and the Septuagint. While studying the New Testament, it is beneficial to use both the Majority Text / Byzantine manuscripts (e.g., NKJV) and the Alexandrian manuscripts (e.g., NASB).',
    ],
  },
  {
    id: 'doctrine',
    tab: 'Doctrine',
    title: 'Doctrine',
    tagline: 'HOW TO INTERPRET SCRIPTURE',
    body: [
      'Doctrine is created by placing in order of importance: Didactic passages first, Narrative passages next, and Poetic passages last. The Bible should be interpreted using a Literal Grammatical-Historical method while recognizing that Hebrew, Aramaic and Greek have figures of speech, and by determining whether the passage is Prescriptive or Descriptive, Time-restricted or Eternally applicable, People or Place restricted or for all people at all places. The antiquity of a doctrine is not proof of its truth, and the novelty of a doctrine is not proof of its falsehood.',
    ],
  },
  {
    id: 'trinity',
    tab: 'Trinity',
    title: 'Trinity',
    tagline: 'THE NATURE OF GOD',
    body: [
      'One God, YHWH, in Three Persons – Father, Jesus Christ the Son, and Holy Spirit. The Father is a Person of the Trinity. Jesus Christ is truly God and truly man, a Person of the Trinity. The Holy Spirit is a Person of the Trinity. The Triune God created the universe and all that is in it. YHWH is holy. Our knowledge of God primarily comes from how He has revealed Himself to us in Scripture.',
    ],
  },
  {
    id: 'man',
    tab: 'Man',
    title: 'Man',
    tagline: "CREATED IN GOD'S IMAGE",
    body: [
      "God creates each human's body, soul, and spirit, and so humans are born innocent and in the image of God. However, humans have a propensity to sin due to persistent exposure to an environment of evil and ignorance of God's laws. Adam and Eve's sin resulted in spiritual death for themselves, and a life of toil and physical death both for themselves and their progeny. God covered them with animal skins, implying an animal sacrifice for their sin and reconciliation. In an act of mercy, God removed man's access to the tree of life, thereby capping his toil and suffering on earth. Spiritual death and physical death are the two consequences for which man had no solution.",
    ],
  },
  {
    id: 'salvation',
    tab: 'Salvation',
    title: 'Salvation',
    tagline: "GOD'S PLAN FOR HUMANITY",
    body: [
      'God the Father in His grace had determined to send the Son to reconcile mankind to Himself. In the fullness of time, Jesus Christ the Son, by His grace, was incarnated, was born of a virgin, lived a sinless life, died for us, and physically rose again from the dead, and now draws all men to Himself. The Holy Spirit convicts all men of their sin, their need for righteousness, and their coming judgment.',
      'The evangelist is a co-worker with God when he shares the good news of what Jesus Christ did for mankind. God in His sovereignty has given every human the libertarian free will to choose Jesus Christ, because salvation is conditional on faith in Jesus Christ, and because God is just. The Holy Spirit, by His grace, regenerates those who place their faith in Jesus Christ. Though salvation can be forfeited by denying Jesus Christ and renouncing the faith, God receives those who return to Him with genuine contrition and repentance.',
    ],
  },
  {
    id: 'atonement',
    tab: 'Atonement',
    title: 'Atonement',
    tagline: "CHRIST'S SACRIFICE FOR SIN",
    body: [
      "The Atonement is how man is reconciled to God. Christus Victor, modified Ransom (ransomed from the Old Covenant Law), and Recapitulation theories of atonement are the classic atonement theories. Jesus Christ is our sin offering, whose sacrificial death ransomed us from the condemnation of the Old Covenant Law, and consequently from sin and death; triumphed over the powers of evil; retraced and reversed Adam's disobedience through His own obedience; and revealed God's love so as to draw sinners to repentance. Neither sin nor guilt was transferred to Christ since in such a case Christ would not have been a sinless offering. While the atonement extends to all mankind, it is applied only to those who have placed their faith in Jesus Christ.",
    ],
  },
  {
    id: 'christian-life',
    tab: 'Holiness',
    title: 'Christian Life',
    tagline: 'LIVING FAITHFULLY IN CHRIST',
    body: [
      'Christians are indwelt by the Holy Spirit and must reveal the fruit of the Spirit in their lives. The Holy Spirit gives spiritual gifts as He wills. Christians ought to order their lives according to the truths found in Scripture – in both belief and practice. While works do not save our souls, it is natural for good works to come out of a life that is faithful to Jesus Christ.',
    ],
  },
  {
    id: 'ordinances',
    tab: 'Ordinances',
    title: 'Church Ordinances',
    tagline: "BAPTISM AND THE LORD'S SUPPER",
    body: [
      "Water Baptism and the Lord's Table are two ordinances that the church must follow. Water Baptism of the believer is Biblical. The Lord's Table – Bread and Cup – is a remembrance of Jesus Christ and a proclamation of His death and His second coming.",
    ],
  },
  {
    id: 'end-times',
    tab: 'End Times',
    title: 'End Times',
    tagline: "OUR HOPE IN CHRIST'S RETURN",
    body: [
      "Jesus Christ will return physically to rapture His people and to rule for 1,000 years on earth. Christians who are martyred for Christ will be in the presence of God immediately after death, and, along with those who did not worship the Beast, will rule with Christ for 1,000 years at His Millennium. Christians who were not martyred for Christ will be resurrected after the Millennium along with the rest of mankind and will be at the Great White Throne judgment. All those whose names are not found in the Lamb's Book of Life will be cast into the lake of fire, while those whose names are written in the Lamb's Book of Life will enter the new Jerusalem and live in God's Presence.",
    ],
  },
]

export function About() {
  const [activeId, setActiveId] = useState(BELIEF_SECTIONS[0].id)
  const active = BELIEF_SECTIONS.find((section) => section.id === activeId) ?? BELIEF_SECTIONS[0]

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#fcfaf7]">
      <section className="relative flex h-[300px] items-center justify-center overflow-hidden bg-[#1f2f3d] px-4 text-center text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src="/article/left_armour_imagehero.svg"
            alt=""
            aria-hidden
            className="absolute left-0 top-1/2 h-[70%] w-auto max-w-[28%] -translate-y-1/2 object-contain object-left opacity-90 sm:max-w-[32%] lg:max-w-[36%]"
          />
          <img
            src="/article/right_armour_imagehero.svg"
            alt=""
            aria-hidden
            className="absolute right-0 top-1/2 h-[70%] w-auto max-w-[28%] -translate-y-1/2 object-contain object-right opacity-90 sm:max-w-[32%] lg:max-w-[36%]"
          />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-center font-serif text-[48px] font-bold leading-none tracking-normal">
            About Us
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-center font-sans text-[16px] font-normal leading-6 tracking-normal text-white/75">
            A short summary of what we believe
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {BELIEF_SECTIONS.map((section) => {
            const isActive = section.id === activeId
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={`rounded-md px-4 py-2.5 font-serif text-base transition-colors sm:px-5 sm:text-lg ${
                  isActive
                    ? 'border-l-[3px] border-[#D4AF37] bg-[#f7f3ea] text-slate-900'
                    : 'text-slate-600 hover:bg-[#f7f3ea]/70 hover:text-slate-900'
                }`}
              >
                {section.tab}
              </button>
            )
          })}
        </div>

        <section id="beliefs" className="mt-10 sm:mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
            We Believe
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold leading-none text-slate-900 sm:text-5xl">
            {active.title}
          </h2>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            {active.tagline}
          </p>
          <span className="mt-2 block h-0.5 w-16 bg-[#D4AF37]" aria-hidden />
          <div className="mt-6 max-w-3xl space-y-5">
            {active.body.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="font-sans text-[16px] font-normal leading-7 text-slate-800"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  )
}
