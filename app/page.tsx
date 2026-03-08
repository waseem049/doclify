'use client';
import HomeNavbar from '@/components/home/Navbar';
import HomeHero from '@/components/home/Hero';
import Footer from '@/components/home/Footer';
import { FileSignature, Edit3, Send, History, Sparkles, Users, Lock, Clock } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: FileSignature,
      title: 'Sign PDF',
      description: 'Add legally binding signatures to your documents in seconds.',
      color: 'bg-teal-50 text-teal-600',
    },
    {
      icon: Edit3,
      title: 'Edit Fields',
      description: 'Add text, dates, initials, and more with drag-and-drop ease.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Send,
      title: 'Request Sign',
      description: 'Send documents to others and track signing progress.',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      icon: History,
      title: 'Audit Trail',
      description: 'Complete history of every action with timestamps.',
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  const benefits = [
    { icon: Sparkles, title: 'AI-Powered', description: 'Smart suggestions and auto-fill' },
    { icon: Users, title: 'Collaboration', description: 'Work with your team seamlessly' },
    { icon: Lock, title: 'Secure', description: 'Enterprise-grade encryption' },
    { icon: Clock, title: 'Save Time', description: 'Sign documents in seconds' },
  ];

  return (
    <main className="min-h-screen bg-white">
      <HomeNavbar />
      <HomeHero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to work with PDFs
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              DocSign gives you professional-grade tools to sign, edit, and manage all your documents in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl mb-5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Why choose DocSign?
              </h2>
              <p className="text-lg text-slate-500 mb-8">
                Join millions of professionals who trust DocSign for their daily document needs. Fast, secure, and incredibly easy to use.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-[#0f766e]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{benefit.title}</h4>
                      <p className="text-sm text-slate-500">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-orange-100 rounded-3xl blur-2xl opacity-50" />
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                <div className="space-y-4">
                  {[
                    { label: 'Upload document', status: 'complete' },
                    { label: 'Add signature field', status: 'complete' },
                    { label: 'Sign & download', status: 'pending' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === 'complete' 
                          ? 'bg-teal-100 text-teal-600' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {step.status === 'complete' ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-semibold">{i + 1}</span>
                        )}
                      </div>
                      <span className={`font-medium ${
                        step.status === 'complete' ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to streamline your workflow?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Join thousands of professionals who trust DocSign for their daily document needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-orange-500/25">
              Get Started for Free
            </button>
            <button className="bg-transparent border-2 border-slate-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
