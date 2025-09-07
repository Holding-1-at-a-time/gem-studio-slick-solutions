
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';

interface FAQItemProps {
    question: string;
    children: React.ReactNode;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, children }) => (
    <div className="border-b border-border py-6">
        <h3 className="text-lg font-semibold mb-2">{question}</h3>
        <div className="text-muted-foreground space-y-2">
            {children}
        </div>
    </div>
);


const KnowledgeBasePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:p-8">
                     <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                           Knowledge Base
                        </h1>
                    </div>
                    <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
                        Back to App
                    </Link>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                 <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h1>
                    <p className="text-xl text-muted-foreground mt-2">Find answers to common questions about Slick Solutions.</p>
                </div>
                
                <Card className="p-6 sm:p-8 max-w-4xl mx-auto">
                    <FAQItem question="How does the AI estimate work?">
                        <p>
                           When you describe your vehicle's condition, our system sends that information to an advanced AI model along with your detailer's base service prices.
                           The AI analyzes your notes (e.g., "pet hair," "deep scratches") to adjust the base prices, creating a personalized and fair estimate based on the expected work.
                        </p>
                    </FAQItem>
                    <FAQItem question="Is the online estimate final?">
                        <p>
                           The AI-generated estimate is highly accurate based on the information you provide. However, it is still an estimate.
                           The final price may be adjusted slightly after an in-person inspection if the vehicle's condition differs significantly from the description.
                        </p>
                    </FAQItem>
                    <FAQItem question="How do I book an appointment after getting an estimate?">
                        <p>
                           After you receive your estimate, you'll be prompted to book an appointment. You can select an available time slot from the detailer's calendar and then securely pay a deposit or the full amount via Stripe to confirm your booking.
                        </p>
                    </FAQItem>
                    <FAQItem question="How can I share my feedback after the service?">
                        <p>
                            Once your booking is confirmed, you will see a link to leave a review. You can use this link to give a star rating and provide comments about your experience. Your feedback is valuable and helps the detailer improve their service!
                        </p>
                    </FAQItem>
                     <FAQItem question="What is a VIN and why do you need it?">
                        <p>
                            A VIN (Vehicle Identification Number) is a unique 17-digit code for your vehicle. Scanning it helps us automatically and accurately identify your vehicle's year, make, and model, speeding up the assessment process.
                        </p>
                    </FAQItem>
                </Card>
            </main>
        </div>
    );
};

export default KnowledgeBasePage;
