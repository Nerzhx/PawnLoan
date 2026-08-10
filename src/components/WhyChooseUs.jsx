import FeatureCard from './FeatureCard';

const WhyChooseUs = () => {
  const features = [
    {
      icon: 'shield',
      title: 'Blockchain Verified',
      description: 'Every transaction is verified on the Stellar network'
    },
    {
      icon: 'trending-up',
      title: 'Real-Time Impact',
      description: 'Track your donation impact with live updates'
    },
    {
      icon: 'heart',
      title: 'Complete Transparency',
      description: 'See exactly where your money goes'
    },
    {
      icon: 'lightning',
      title: 'Low Fees',
      description: 'More of your money reaches the cause'
    }
  ];

  return (
    <section className="bg-light-bg py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] text-center mb-16">
          Why choose PawnLoan?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;

