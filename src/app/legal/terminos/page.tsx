import { LegalLayout } from "@/components/layout/LegalLayout";

export default function TerminosPage() {
  return (
    <LegalLayout title="Términos de Servicio" lastUpdated="15 de Abril, 2026">
      <section>
        <h2>1. Aceptación de los Términos</h2>
        <p>
          Al acceder o utilizar la plataforma <strong>NERVE Health Systems</strong> (en adelante, "el Software"), usted ("el Usuario" o "el Suscriptor") acepta estar legalmente vinculado por los presentes Términos de Servicio. Si no está de acuerdo con alguna de las cláusulas aquí establecidas, debe cesar inmediatamente el uso del Software.
        </p>
      </section>

      <section>
        <h2>2. Naturaleza del Servicio: Exención Médica</h2>
        <p>
          <strong>IMPORTANTE:</strong> NERVE Health Systems es exclusivamente una herramienta de software diseñada para la gestión administrativa y clínica de consultorios. 
          <strong>NERVE no es un dispositivo médico, no proporciona diagnósticos y no ofrece asesoramiento médico profesional.</strong>
        </p>
        <p>
          El uso del Software no sustituye el juicio clínico independiente del profesional de la salud. Todas las decisiones médicas, prescripciones de medicamentos, diagnósticos realizados y tratamientos sugeridos a través del uso de la herramienta son responsabilidad <strong>absoluta y exclusiva</strong> del médico tratante que utiliza la plataforma.
        </p>
      </section>

      <section>
        <h2>3. Responsabilidad por Recetas y Diagnósticos</h2>
        <p>
          NERVE facilita la generación de formatos de recetas y el almacenamiento de notas clínicas, pero no valida la corrección médica de la información introducida por el Usuario. 
          <strong>En ningún caso NERVE Health Systems, sus desarrolladores, directivos o proveedores serán responsables por:</strong>
        </p>
        <ul>
          <li>Errores en la dosificación, elección de fármacos o omisiones en las recetas generadas.</li>
          <li>Reacciones adversas en pacientes derivadas de tratamientos gestionados mediante el Software.</li>
          <li>Cualquier daño, lesión o fatalidad derivada de la práctica médica del Usuario.</li>
        </ul>
      </section>

      <section>
        <h2>4. Seguridad y Aislamiento de Datos (Multi-Tenancy)</h2>
        <p>
          NERVE utiliza arquitectura <strong>Multi-Tenant</strong> con aislamiento estricto mediante Row-Level Security (RLS). Sin embargo, el Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. Cualquier acción realizada bajo su cuenta será atribuida legalmente al Usuario.
        </p>
      </section>

      <section>
        <h2>5. Limitación de Responsabilidad</h2>
        <p>
          En la medida máxima permitida por la ley aplicable, el Software se proporciona "tal cual" y "según disponibilidad". NERVE no garantiza que el acceso sea ininterrumpido o esté libre de errores.
        </p>
        <p>
          La responsabilidad total de NERVE ante cualquier reclamo derivado del uso del servicio se limitará estrictamente al monto total pagado por el Usuario por el servicio durante los últimos tres (3) meses anteriores al evento que dio origen al reclamo. 
        </p>
        <p>
          <strong>No seremos responsables por:</strong> lucro cesante, pérdida de datos, interrupción de negocio o cualquier daño indirecto, incidental o consecuente.
        </p>
      </section>

      <section>
        <h2>6. Pagos, Suscripciones y Stripe Connect</h2>
        <p>
          NERVE procesa todas las suscripciones mensuales del software a través del procesador internacional de pagos seguros <strong>Stripe</strong>. Al registrarse, el Usuario acepta los Términos de Servicio de Stripe.
        </p>
        <p>
          Asimismo, para la gestión de cobros de pacientes (anticipos o consultas completas), NERVE utiliza la infraestructura de <strong>Stripe Connect</strong>. Los doctores actúan como cuentas conectadas de Stripe y son responsables de la validez de los datos de depósito bancario (como la CLABE o IBAN) proporcionados a NERVE. 
        </p>
      </section>

      <section>
        <h2>7. Política de Cancelación, Reembolsos y Devoluciones</h2>
        <p>
          <strong>Suscripción de NERVE:</strong> El Usuario puede cancelar su suscripción mensual de NERVE en cualquier momento desde el panel de facturación. No se realizarán reembolsos por periodos ya facturados o parciales del mes en curso tras la cancelación.
        </p>
        <p>
          <strong>Cobros de Pacientes a Doctores:</strong> NERVE es un intermediario tecnológico. La política de reembolso o cancelación de una consulta médica pagada a través de Stripe (anticipos o montos completos) se rige de acuerdo con las políticas individuales de cada doctor o clínica. Cualquier solicitud de devolución de fondos de un paciente deberá gestionarse de forma directa con el médico emisor del cobro. NERVE no interviene en disputas médicas o de servicio.
        </p>
      </section>

      <section>
        <h2>8. Razón Social, Dirección y Contacto Comercial</h2>
        <p>
          De conformidad con los requisitos legales internacionales y de nuestros proveedores de servicios financieros, los detalles de operación de la plataforma son:
        </p>
        <ul>
          <li><strong>Nombre Comercial:</strong> NERVE Health Systems</li>
          <li><strong>Dirección Fiscal / Operativa:</strong> Jose Maria Morelos y Pavon #1306, Colonia Independencia, Coatzacoalcos, Veracruz, C.P. 96556, México.</li>
          <li><strong>Correo Electrónico de Soporte:</strong> soporte@nervehealthsystems.com</li>
          <li><strong>Teléfono de Atención al Cliente:</strong> +52 446 479 6116</li>
        </ul>
      </section>

      <section>
        <h2>9. Jurisdicción</h2>
        <p>
          Cualquier controversia derivada de este acuerdo se regirá por las leyes de los Estados Unidos Mexicanos y será sometida a la jurisdicción de los tribunales competentes en Coatzacoalcos, Veracruz, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.
        </p>
      </section>
    </LegalLayout>
  );
}
