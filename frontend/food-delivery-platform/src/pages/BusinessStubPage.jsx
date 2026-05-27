import React from "react";
import "../components/styles/BusinessHomePage.css";

export default function BusinessStubPage({ title, description, icon: Icon }) {
    return (
        <main className="bh-main">
            <header className="bh-top">
                <h1 className="bh-heading">{title}</h1>
            </header>
            <section className="bh-content">
                <div className="bh-empty">
                    {Icon && <Icon size={64} />}
                    <p>{description}</p>
                </div>
            </section>
        </main>
    );
}
