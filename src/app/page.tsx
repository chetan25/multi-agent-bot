import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <div className="text-center mb-16 mt-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Our Platform
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Experience the power of modern web development with Next.js,
          shadcn/ui, and Tailwind CSS.
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
            Explore Features
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">🚀</span>
              </div>
              <span>Fast Performance</span>
            </CardTitle>
            <CardDescription>
              Built with Next.js for optimal speed and performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Experience lightning-fast loading times and smooth interactions
              with our optimized platform.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">🎨</span>
              </div>
              <span>Beautiful Design</span>
            </CardTitle>
            <CardDescription>
              Stunning UI components powered by shadcn/ui and Tailwind CSS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Modern, accessible, and customizable components that look great
              out of the box.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">⚡</span>
              </div>
              <span>Easy Development</span>
            </CardTitle>
            <CardDescription>
              Developer-friendly tools and components for rapid development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Streamlined development workflow with TypeScript, hot reloading,
              and excellent DX.
            </p>
          </CardContent>
        </Card>

        <Link href="/integrations/chat">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-bold">💬</span>
                </div>
                <span>Chat Integration</span>
              </CardTitle>
              <CardDescription>
                Interactive chat functionality with real-time messaging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Connect with users through our powerful chat system with
                multi-modal capabilities and AI assistance.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Responsive Design
                </h4>
                <p className="text-gray-600 text-sm">
                  Works perfectly on all devices and screen sizes.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  TypeScript Support
                </h4>
                <p className="text-gray-600 text-sm">
                  Full TypeScript support for better development experience.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Accessibility</h4>
                <p className="text-gray-600 text-sm">
                  WCAG compliant components for inclusive design.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Customizable</h4>
                <p className="text-gray-600 text-sm">
                  Easy to customize and extend to match your brand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
