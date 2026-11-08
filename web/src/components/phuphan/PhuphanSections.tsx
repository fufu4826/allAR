import { phuphanCentre, phuphanContact, phuphanSteps } from "@/content/phuphan";
import type { Community } from "@/lib/types";

// Sections carried over from the original Phu Phan AR site: centre information with the
// contact card, and the stats + "3 steps" guide. Styled by phuphan-theme.css.

export function PhuphanCentre({ community }: { community: Community }) {
  const [lat, lng] = community.position;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(phuphanContact.directionsQuery)}`;

  return (
    <section id="about" className="community-section pp-centre" aria-labelledby="pp-centre-title">
      <div className="community-container">
        <p className="eyebrow pp-pill">{phuphanCentre.eyebrow}</p>
        <h2 id="pp-centre-title">{community.name}</h2>

        <div className="pp-centre-grid">
          <div className="pp-story">
            <p className="pp-aliases">
              <span>ชื่อเรียกอื่น</span> {phuphanCentre.aliases}
            </p>
            <p className="pp-intro">{phuphanCentre.intro}</p>
            <h3>{phuphanCentre.missionTitle}</h3>
            <ol className="pp-mission">
              {phuphanCentre.missions.map((mission) => (
                <li key={mission}>{mission}</li>
              ))}
            </ol>
            <p>{phuphanCentre.closing}</p>
            <p className="pp-source">
              เรียบเรียงจาก{" "}
              {phuphanCentre.sources.map((source, i) => (
                <span key={source.href}>
                  {i > 0 && " และ "}
                  <a href={source.href} target="_blank" rel="noopener noreferrer">
                    {source.label}
                  </a>
                </span>
              ))}
            </p>
          </div>

          <aside id="location" className="pp-contact" aria-label="ที่ตั้งและติดต่อศูนย์ภูพาน">
            <div className="pp-map">
              <iframe
                title={`แผนที่${community.name}`}
                src={`https://www.google.com/maps?q=${lat},${lng}&hl=th&z=14&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className="pp-contact-body">
              <p className="pp-kicker">{phuphanContact.kicker}</p>
              <h3>{community.name}</h3>
              <dl className="pp-facts">
                <div>
                  <dt>
                    <i className="fa-solid fa-location-dot" aria-hidden="true"></i> ที่อยู่
                  </dt>
                  <dd>
                    <address>{phuphanContact.address}</address>
                  </dd>
                </div>
                <div>
                  <dt>
                    <i className="fa-solid fa-phone" aria-hidden="true"></i> โทรศัพท์
                  </dt>
                  <dd>
                    {phuphanContact.phones.map((phone, i) => (
                      <span key={phone.tel}>
                        {i > 0 && " หรือ "}
                        <a href={`tel:${phone.tel}`}>{phone.label}</a>
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt>
                    <i className="fa-regular fa-clock" aria-hidden="true"></i> ก่อนเดินทาง
                  </dt>
                  <dd>{phuphanContact.beforeVisit}</dd>
                </div>
              </dl>
              <div className="pp-actions">
                <a className="button pp-button" href={directions} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-location-arrow" aria-hidden="true"></i> นำทางไปศูนย์ภูพาน
                </a>
                <a className="button pp-button-secondary" href={`tel:${phuphanContact.phones[0].tel}`}>
                  <i className="fa-solid fa-phone" aria-hidden="true"></i> โทรหาศูนย์
                </a>
              </div>
              <p className="pp-source">
                ที่มา:{" "}
                <a href={phuphanContact.source.href} target="_blank" rel="noopener noreferrer">
                  {phuphanContact.source.label}
                </a>{" "}
                · {phuphanContact.source.note}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export function PhuphanHowTo({ community }: { community: Community }) {
  const modelCount = community.items.filter((item) => item.model).length;

  return (
    <section className="community-section pp-howto" aria-labelledby="pp-howto-title">
      <div className="community-container">
        <div className="pp-stats">
          <div className="pp-stat">
            <strong>{community.collections.length}</strong>
            <span>แหล่งเรียนรู้</span>
          </div>
          <div className="pp-stat">
            <strong>{modelCount}</strong>
            <span>โมเดล</span>
          </div>
        </div>

        <div className="pp-howto-head">
          <h2 id="pp-howto-title">{phuphanSteps.title}</h2>
          <p>{phuphanSteps.lead}</p>
        </div>
        <ol className="pp-steps">
          {phuphanSteps.steps.map((step, i) => (
            <li key={step.title} className="pp-step">
              <span className="pp-step-number" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
