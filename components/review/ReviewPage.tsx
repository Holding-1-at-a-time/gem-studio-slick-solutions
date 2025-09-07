
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Spinner from '../ui/Spinner';

const StarRating: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
    return (
        <div className="flex justify-center gap-2">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => {}}
                        onMouseLeave={() => {}}
                        className="transition-transform hover:scale-110"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill={starValue <= rating ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-yellow-400"
                        >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </button>
                );
            })}
        </div>
    );
};


const ReviewPage: React.FC = () => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const submitReview = useMutation(api.reviews.submitReview);
    const [isLoading, setIsLoading] = useState(false);

    const { appointmentId } = useParams<{ appointmentId: Id<"appointments"> }>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointmentId) return;
        if (rating === 0) {
            setError("Please select a star rating.");
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await submitReview({ appointmentId, rating, comment });
            setIsSubmitted(true);
        } catch (err: any) {
            console.error(err);
            setError(err.data?.message || 'Failed to submit review. It may have already been submitted.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!appointmentId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="p-8 text-center">
                    <h1 className="text-2xl font-bold text-destructive-foreground">Invalid Link</h1>
                    <p className="text-muted-foreground">The review link is missing an appointment ID.</p>
                </Card>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="p-8 text-center space-y-4">
                     <div className="flex justify-center text-green-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <h1 className="text-2xl font-bold">Thank You!</h1>
                    <p className="text-muted-foreground">Your feedback has been submitted successfully.</p>
                </Card>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg">
                 <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold tracking-tight">Leave a Review</h1>
                    <p className="text-xl text-muted-foreground">We'd love to hear your feedback on our service.</p>
                </div>
                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-center block text-lg font-medium">How would you rate your experience?</label>
                            <StarRating rating={rating} setRating={setRating} />
                        </div>
                        <div className="space-y-2">
                             <label htmlFor="comment" className="text-lg font-medium">Any additional comments?</label>
                            <Textarea 
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us more about what you liked or what we can improve..."
                                rows={4}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Spinner size="sm" /> : 'Submit Review'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ReviewPage;
