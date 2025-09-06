import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import Spinner from '../ui/Spinner';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Label from '../ui/Label';
import Textarea from '../ui/Textarea';
import VinScanner from './VinScanner';

const StepIndicator: React.FC<{ currentStep: number; totalSteps: number; }> = ({ currentStep, totalSteps }) => (
    <div className="flex justify-center items-center space-x-2 mb-8">
        {[...Array(totalSteps)].map((_, i) => (
            <React.Fragment key={i}>
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i + 1 <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                    {i + 1}
                </div>
                {i < totalSteps - 1 && <div className="w-12 h-1 bg-border"></div>}
            </React.Fragment>
        ))}
    </div>
);

const BookingConfirmation: React.FC = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const assessmentId = urlParams.get('assessmentId') as Id<"assessments"> | null;
    const appointment = useQuery(api.scheduling.getAppointmentByAssessmentId, assessmentId ? { assessmentId } : 'skip');
    
    return (
        <div className="text-center space-y-4 py-8">
            <div className="flex justify-center text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2 className="text-2xl font-semibold">Appointment Booked!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
                Thank you. Your appointment is confirmed. You will receive an email shortly with the details.
            </p>
            {appointment === undefined && <div className="h-10 flex justify-center items-center"><Spinner /></div>}
            {appointment && (
                <div className="pt-4">
                    <a href={`/review?appointmentId=${appointment._id}`} className="w-full">
                        <Button className="w-full max-w-xs mx-auto">Leave a Review</Button>
                    </a>
                </div>
            )}
             <p className="text-sm text-muted-foreground mt-4">You can now safely close this window.</p>
        </div>
    );
};

const AIChat: React.FC<{ clerkOrgId: string, onClose: () => void }> = ({ clerkOrgId, onClose }) => {
    const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const askConcierge = useAction(api.aiAgents.askConcierge);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage = { sender: 'user', text: input } as const;
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await askConcierge({ clerkOrgId, question: input });
            setMessages(prev => [...prev, { sender: 'ai', text: response }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { sender: 'ai', text: "I'm sorry, I'm having trouble connecting. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md h-[70vh] flex flex-col p-0">
                <header className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold">AI Customer Concierge</h2>
                    <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
                </header>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="p-3 rounded-lg bg-secondary text-secondary-foreground text-sm">
                        <p className="font-bold">AI Concierge</p>
                        <p>Hello! How can I help you with your detailing service questions today?</p>
                    </div>
                    {messages.map((msg, index) => (
                        <div key={index} className={`p-3 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-secondary text-secondary-foreground'}`} style={{ maxWidth: '80%' }}>
                             <p className="font-bold">{msg.sender === 'user' ? 'You' : 'AI Concierge'}</p>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-center"><Spinner/></div>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-border flex gap-2">
                    <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about services..." onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={isLoading} />
                    <Button onClick={handleSend} disabled={isLoading}>Send</Button>
                </div>
            </Card>
        </div>
    );
};

const AssessmentPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        clientName: '', clientEmail: '', clientPhone: '',
        vehicleYear: '', vehicleMake: '', vehicleModel: '', vin: '',
        conditionNotes: '',
    });
    const [assessmentId, setAssessmentId] = useState<Id<"assessments"> | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const urlParams = new URLSearchParams(window.location.search);
    const clerkOrgId = urlParams.get('tenantId');
    const stripeSessionId = urlParams.get('session_id');

    const tenant = useQuery(api.tenants.getTenantByOrgId, clerkOrgId ? { clerkOrgId } : 'skip');
    const availableSlots = useQuery(api.availability.getAvailableSlots, clerkOrgId ? { clerkOrgId } : 'skip');
    const submitAssessment = useMutation(api.assessments.submitAssessment);
    const createCheckout = useAction(api.scheduling.createStripeCheckoutSession);
    const estimate = useQuery(api.assessments.getEstimate, assessmentId ? { assessmentId } : 'skip');
    
    useEffect(() => {
        if (stripeSessionId) setStep(6);
    }, [stripeSessionId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleScanSuccess = (scannedVin: string) => {
        setFormData(prev => ({ ...prev, vin: scannedVin, vehicleYear: '2021', vehicleMake: 'Tesla', vehicleModel: 'Model 3' }));
        setIsScanning(false);
    };

    const handleSubmitAssessment = async () => {
        if (!clerkOrgId) return;
        setError('');
        try {
            const id = await submitAssessment({ clerkOrgId, ...formData });
            setAssessmentId(id);
            setStep(step + 1); 
        } catch (e: any) {
            setError("Failed to submit assessment. Please try again.");
        }
    };
    
    const handlePayment = async () => {
        if (!estimate || !assessmentId || !selectedTime) return;
        setIsProcessingPayment(true);
        try {
            const { url } = await createCheckout({ assessmentId, selectedTime, estimateTotal: estimate.total, tenantName: tenant?.name || "Service", clientEmail: formData.clientEmail });
            if(url) window.location.href = url;
            else setError("Could not initiate payment.");
        } catch (e) {
            setError("An error occurred during payment processing.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    if (!clerkOrgId || tenant === null) {
        return <div className="flex items-center justify-center min-h-screen"><Card className="p-8 text-center"><h1 className="text-2xl font-bold text-destructive-foreground">Invalid Link</h1><p className="text-muted-foreground">The business was not found.</p></Card></div>;
    }
    if (tenant === undefined) {
        return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
    }

    const primaryButtonStyle = { backgroundColor: tenant.themeColor, color: tenant.themeColor === '#ffffff' ? 'hsl(222.2 47.4% 11.2%)' : 'hsl(210 40% 98%)' };
    const primaryDivStyle = { '--primary-color': tenant.themeColor, '--primary-foreground-color': tenant.themeColor === '#ffffff' ? 'hsl(222.2 47.4% 11.2%)' : 'hsl(210 40% 98%)' } as React.CSSProperties;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8" style={primaryDivStyle}>
            <style>{`.themed-bg { background-color: var(--primary-color) !important; } .themed-text { color: var(--primary-foreground-color) !important; } .themed-border { border-color: var(--primary-color) !important; }`}</style>
            
            {isScanning && <VinScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScanning(false)} />}
            {isChatOpen && <AIChat clerkOrgId={clerkOrgId} onClose={() => setIsChatOpen(false)} />}

            <div className="fixed bottom-5 right-5 z-40">
                <Button onClick={() => setIsChatOpen(true)} className="rounded-full w-16 h-16 shadow-lg" style={primaryButtonStyle}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/><path d="M12 13V7"/><path d="M12 17h.01"/></svg></Button>
            </div>
            
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8"><h1 className="text-4xl font-extrabold tracking-tight">Vehicle Self-Assessment</h1><p className="text-xl text-muted-foreground">for {tenant.name}</p></div>
                <Card className="p-6 sm:p-8">
                    <StepIndicator currentStep={step} totalSteps={6} />
                    
                    {step === 1 && (
                        <div className="space-y-4"><h2 className="text-2xl font-semibold text-center mb-4">Your Contact Information</h2>
                            <div className="space-y-2"><Label htmlFor="clientName">Full Name</Label><Input id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} placeholder="John Doe" /></div>
                            <div className="space-y-2"><Label htmlFor="clientEmail">Email</Label><Input id="clientEmail" name="clientEmail" type="email" value={formData.clientEmail} onChange={handleChange} placeholder="john.doe@example.com" /></div>
                            <div className="space-y-2"><Label htmlFor="clientPhone">Phone Number</Label><Input id="clientPhone" name="clientPhone" type="tel" value={formData.clientPhone} onChange={handleChange} placeholder="(555) 123-4567" /></div>
                            <Button className="w-full" onClick={() => setStep(2)} disabled={!formData.clientName || !formData.clientEmail} style={primaryButtonStyle}>Next</Button>
                        </div>
                    )}
                    
                    {step === 2 && (
                         <div className="space-y-4"><h2 className="text-2xl font-semibold text-center mb-4">Vehicle Details</h2>
                            <div className="relative space-y-2"><Label htmlFor="vin">VIN</Label><Input id="vin" name="vin" value={formData.vin} onChange={handleChange} placeholder="17-digit Vehicle Identification Number" /><Button variant="secondary" size="sm" className="absolute right-1 top-[26px] h-8 px-3" onClick={() => setIsScanning(true)}>Scan VIN</Button></div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label htmlFor="vehicleYear">Year</Label><Input id="vehicleYear" name="vehicleYear" value={formData.vehicleYear} onChange={handleChange} placeholder="2020" /></div>
                                <div className="space-y-2"><Label htmlFor="vehicleMake">Make</Label><Input id="vehicleMake" name="vehicleMake" value={formData.vehicleMake} onChange={handleChange} placeholder="Toyota" /></div>
                                <div className="space-y-2"><Label htmlFor="vehicleModel">Model</Label><Input id="vehicleModel" name="vehicleModel" value={formData.vehicleModel} onChange={handleChange} placeholder="Camry" /></div>
                            </div>
                            <div className="flex justify-between w-full"><Button variant="secondary" onClick={() => setStep(1)}>Back</Button><Button onClick={() => setStep(3)} disabled={!formData.vehicleMake || !formData.vin} style={primaryButtonStyle}>Next</Button></div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4"><h2 className="text-2xl font-semibold text-center mb-4">Vehicle Condition</h2>
                            <div className="space-y-2"><Label htmlFor="conditionNotes">Describe your vehicle's condition</Label><Textarea id="conditionNotes" name="conditionNotes" value={formData.conditionNotes} onChange={handleChange} placeholder="e.g., lots of pet hair on the back seats, coffee stain, deep scratches on hood..." rows={5} /></div>
                            <div className="flex justify-between w-full"><Button variant="secondary" onClick={() => setStep(2)}>Back</Button><Button onClick={handleSubmitAssessment} disabled={!formData.conditionNotes} style={primaryButtonStyle}>Get My Estimate</Button></div>
                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        </div>
                    )}

                    {step === 4 && (
                        <div>
                            {!estimate ? (<div className="text-center space-y-4 py-8"><div className="flex justify-center"><Spinner size="lg" /></div><h2 className="text-2xl font-semibold">Generating Your Estimate...</h2><p className="text-muted-foreground">Our AI is analyzing your vehicle's condition...</p></div>) :
                            (<div><h2 className="text-2xl font-semibold mb-4 text-center">Your AI-Generated Estimate</h2>
                                <ul className="space-y-2 text-left border border-border rounded-md p-4 mb-4">
                                    {estimate.items.map((item, index) => (<li key={index} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-b-0 last:pb-0"><span>{item.description}</span><span className="font-bold">${item.price.toFixed(2)}</span></li>))}
                                </ul>
                                {estimate.suggestedAddons && estimate.suggestedAddons.length > 0 && (
                                    <div className="my-4"><h3 className="font-semibold text-center mb-2">Suggested Add-ons</h3>
                                        <ul className="space-y-2 text-left border border-border/50 rounded-md p-4 bg-secondary/50">
                                            {estimate.suggestedAddons.map((item, index) => (<li key={index} className="flex justify-between items-center text-sm"><div className="flex flex-col"><span>{item.name}</span><span className="text-xs text-muted-foreground">{item.description}</span></div><span className="font-bold">${item.price.toFixed(2)}</span></li>))}
                                        </ul>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-xl font-bold p-4 bg-secondary rounded-md"><span>Total Estimate</span><span>${estimate.total.toFixed(2)}</span></div>
                                <p className="text-xs text-muted-foreground mt-4 text-center">This is an estimate. Prices may be adjusted after in-person inspection.</p>
                                <Button className="w-full mt-6" onClick={() => setStep(5)} style={primaryButtonStyle}>Book Your Appointment</Button>
                            </div>)}
                            {error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}
                        </div>
                    )}

                    {step === 5 && (
                        <div><h2 className="text-2xl font-semibold text-center mb-4">Select an Appointment Time</h2>
                            {availableSlots === undefined ? <div className="flex justify-center p-4"><Spinner /></div> : (availableSlots.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                    {availableSlots.map(slot => (<button key={slot} onClick={() => setSelectedTime(slot)} className={`p-3 rounded-md text-sm text-center border transition-colors ${selectedTime === slot ? 'themed-bg themed-text themed-border' : 'bg-secondary hover:bg-accent border-border'}`}><p className="font-semibold">{new Date(slot).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p><p>{new Date(slot).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p></button>))}
                                </div>
                            ) : (<p className="text-muted-foreground text-center">No available appointments.</p>))}
                            <Button className="w-full" onClick={handlePayment} disabled={isProcessingPayment || !selectedTime} style={primaryButtonStyle}>{isProcessingPayment ? <Spinner size="sm" /> : `Pay $${estimate?.total.toFixed(2)} & Confirm`}</Button>
                            {error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}
                        </div>
                    )}
                    
                    {step === 6 && <BookingConfirmation />}
                </Card>
            </div>
        </div>
    );
};

export default AssessmentPage;
