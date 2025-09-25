const crypto = require('crypto');
const { createActivationKey } = require('../src/utils/hmac');


interface KeyConfig {
  identifier: string;
  plan: string;
  daysValid: number;
  secret: string;
}

/**
 * Generate a demo activation key
 */
function generateDemoKey(config: KeyConfig): string {
  const now = new Date();
  const expiry = new Date(now.getTime() + (config.daysValid * 24 * 60 * 60 * 1000));
  const nonce = crypto.randomBytes(8).toString('hex');
  
  return createActivationKey(
    config.identifier,
    expiry.toISOString(),
    config.plan,
    nonce,
    config.secret
  );
}

/**
 * Main function to generate and display keys
 */
function main(): void {
  const secret = process.env.ACT_KEY_SECRET || 'demo_secret_change_me';
  
  if (secret === 'replace_me' || secret === 'demo_secret_change_me') {
    console.warn('⚠️  WARNING: Using default secret. Set ACT_KEY_SECRET environment variable for production!');
  }

  console.log('🔑 Traducteur Rapide - Activation Key Generator');
  console.log('================================================\n');

  // Generate demo keys for different plans
  const demoConfigs: KeyConfig[] = [
    {
      identifier: 'demo-user-basic',
      plan: 'basic',
      daysValid: 30,
      secret
    },
    {
      identifier: 'demo-user-premium',
      plan: 'premium',
      daysValid: 90,
      secret
    },
    {
      identifier: 'demo-user-enterprise',
      plan: 'enterprise',
      daysValid: 365,
      secret
    }
  ];

  demoConfigs.forEach((config, index) => {
    const key = generateDemoKey(config);
    const expiry = new Date(Date.now() + (config.daysValid * 24 * 60 * 60 * 1000));
    
    console.log(`Demo Key ${index + 1}:`);
    console.log(`  Identifier: ${config.identifier}`);
    console.log(`  Plan: ${config.plan}`);
    console.log(`  Valid until: ${expiry.toISOString()}`);
    console.log(`  Key: ${key}`);
    console.log();
    
    // Show curl command for testing
    console.log(`  Test with curl:`);
    console.log(`  curl -X POST http://localhost:4000/api/activate \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"key":"${key}"}'`);
    console.log('\n' + '='.repeat(80) + '\n');
  });

  // Custom key generation
  if (process.argv.length > 2) {
    const identifier = process.argv[2] || 'custom-user';
    const plan = process.argv[3] || 'basic';
    const days = parseInt(process.argv[4]) || 30;
    
    const customKey = generateDemoKey({
      identifier,
      plan,
      daysValid: days,
      secret
    });
    
    console.log('Custom Key:');
    console.log(`  Identifier: ${identifier}`);
    console.log(`  Plan: ${plan}`);
    console.log(`  Days Valid: ${days}`);
    console.log(`  Key: ${customKey}`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { generateDemoKey };