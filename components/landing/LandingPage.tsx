
import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import Button from '../ui/Button';

const LandingHeader = () => (
    <header className="border-b border-border fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12.2 2h-.4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path><path d="M18 2h-1.8c-1.24 0-2.25 1-2.25 2.25v13.5C13.95 19 14.96 20 16.2 20H18a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path><path d="M6 2H4.8c-1.24 0-2.25 1-2.25 2.25v13.5C2.55 19 3.56 20 4.8 20H6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path></svg>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Slick Solutions</h1>
        </div>
        <div className="flex items-center gap-4">
            {/* Fix: Replaced `afterSignInUrl` with `redirectUrl` to fix prop type error. */}
             <SignInButton mode="modal" redirectUrl="/dashboard">
                <Button variant="secondary">Sign In</Button>
            </SignInButton>
            {/* Fix: Replaced `afterSignUpUrl` with `redirectUrl` to fix prop type error. */}
             <SignUpButton mode="modal" redirectUrl="/dashboard">
                <Button>Get Started</Button>
            </SignUpButton>
        </div>
      </div>
    </header>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-lg border border-border">
        <div className="mb-4 text-primary bg-primary/10 rounded-full p-3">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);

const TestimonialCard = ({ quote, author, title }: { quote: string; author: string; title: string }) => (
    <div className="p-6 bg-secondary/30 rounded-lg border border-border">
        <blockquote className="italic text-muted-foreground">"{quote}"</blockquote>
        <p className="font-semibold mt-4">{author}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
    </div>
);


const LandingPage: React.FC = () => {
    return (
        <>
            <LandingHeader />
            <main className="pt-16">
                {/* Hero Section */}
                <section className="text-center py-20 md:py-32">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
                            The AI-Powered OS for Your Detailing Business
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                            Stop juggling apps. From AI-powered client assessments to automated scheduling and analytics, Slick Solutions is the all-in-one platform designed to save you time and grow your revenue.
                        </p>
                        {/* Fix: Replaced `afterSignUpUrl` with `redirectUrl` to fix prop type error. */}
                        <SignUpButton mode="modal" redirectUrl="/dashboard">
                            <Button className="h-12 px-8 text-lg">Get Started for Free</Button>
                        </SignUpButton>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-secondary/20">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Scale Your Business</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>}
                                title="AI-Powered Estimates"
                                description="Convert leads 24/7 with a smart self-assessment tool that gives clients instant, accurate quotes based on their vehicle's condition."
                            />
                            <FeatureCard 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>}
                                title="Seamless Scheduling & Payments"
                                description="Let clients book and pay online instantly. Sync with your calendar and eliminate phone tag for good."
                            />
                            <FeatureCard 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><path d="M18 20V4"/><path d="M6 20V16"/></svg>}
                                title="Business Analytics"
                                description="Track your revenue, appointments, and client feedback with an intelligent dashboard that provides actionable insights to help you grow."
                            />
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-20">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12">Trusted by Detailers Who Love to Grow</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <TestimonialCard 
                                quote="Slick Solutions cut my admin time in half. The AI estimates are scarily accurate and my clients love the easy booking process."
                                author="Marcus R."
                                title="Owner, ProShine Detailing"
                            />
                            <TestimonialCard 
                                quote="I was skeptical about another app, but this is different. The analytics dashboard gave me insights that actually helped me optimize my pricing. A must-have."
                                author="Jessica L."
                                title="Founder, Gleam Auto Spa"
                            />
                            <TestimonialCard 
                                quote="The QR code for self-assessment is genius. I put it on my business cards and get leads while I'm sleeping. My booking rate has gone up 30%."
                                author="David Chen"
                                title="Mobile Detailer, DC Auto Care"
                            />
                        </div>
                    </div>
                </section>
                
                {/* Final CTA */}
                <section className="py-20 bg-secondary/20">
                    <div className="container mx-auto px-4 text-center">
                         <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
                         <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                           Join dozens of other detailing professionals who are saving time, booking more jobs, and building a better business with Slick Solutions.
                         </p>
                        {/* Fix: Replaced `afterSignUpUrl` with `redirectUrl` to fix prop type error. */}
                        <SignUpButton mode="modal" redirectUrl="/dashboard">
                            <Button className="h-12 px-8 text-lg">Start Your Free Trial</Button>
                        </SignUpButton>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border py-6">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Slick Solutions. All Rights Reserved.
                </div>
            </footer>
        </>
    );
};

export default LandingPage;